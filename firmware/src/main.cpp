#include <array>
#include <cstdint>
#include <cstring>

#include "driver/gpio.h"
#include "driver/i2c.h"
#include "esp_err.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

namespace {
constexpr char kTag[] = "hello_world";
constexpr i2c_port_t kI2cPort = I2C_NUM_0;
constexpr gpio_num_t kSda = GPIO_NUM_17;
constexpr gpio_num_t kScl = GPIO_NUM_18;
constexpr gpio_num_t kReset = GPIO_NUM_21;
constexpr gpio_num_t kVext = GPIO_NUM_36;
constexpr uint8_t kAddress = 0x3c;
constexpr int kWidth = 128;
constexpr int kPages = 8;

std::array<uint8_t, kWidth * kPages> framebuffer{};

esp_err_t write_command(const uint8_t *commands, size_t length) {
  std::array<uint8_t, 32> packet{};
  if (length + 1 > packet.size()) return ESP_ERR_INVALID_SIZE;
  std::memcpy(packet.data() + 1, commands, length);
  return i2c_master_write_to_device(kI2cPort, kAddress, packet.data(),
                                    length + 1, pdMS_TO_TICKS(100));
}

esp_err_t flush() {
  const uint8_t window[] = {0x21, 0, kWidth - 1, 0x22, 0, kPages - 1};
  ESP_ERROR_CHECK(write_command(window, sizeof(window)));

  std::array<uint8_t, 17> packet{};
  packet[0] = 0x40;
  for (size_t offset = 0; offset < framebuffer.size(); offset += 16) {
    std::memcpy(packet.data() + 1, framebuffer.data() + offset, 16);
    ESP_ERROR_CHECK(i2c_master_write_to_device(
        kI2cPort, kAddress, packet.data(), packet.size(), pdMS_TO_TICKS(100)));
  }
  return ESP_OK;
}

std::array<uint8_t, 5> glyph(char character) {
  switch (character) {
    case 'H': return {0x7f, 0x08, 0x08, 0x08, 0x7f};
    case 'E': return {0x7f, 0x49, 0x49, 0x49, 0x41};
    case 'L': return {0x7f, 0x40, 0x40, 0x40, 0x40};
    case 'O': return {0x3e, 0x41, 0x41, 0x41, 0x3e};
    case 'W': return {0x3f, 0x40, 0x38, 0x40, 0x3f};
    case 'R': return {0x7f, 0x09, 0x19, 0x29, 0x46};
    case 'D': return {0x7f, 0x41, 0x41, 0x22, 0x1c};
    default: return {0, 0, 0, 0, 0};
  }
}

void set_pixel(int x, int y) {
  if (x < 0 || x >= kWidth || y < 0 || y >= kPages * 8) return;
  framebuffer[x + (y / 8) * kWidth] |= 1U << (y % 8);
}

void draw_text(int x, int y, const char *text, int scale) {
  for (size_t index = 0; text[index]; ++index) {
    const auto columns = glyph(text[index]);
    for (int column = 0; column < 5; ++column) {
      for (int row = 0; row < 7; ++row) {
        if ((columns[column] & (1U << row)) == 0) continue;
        for (int dx = 0; dx < scale; ++dx) {
          for (int dy = 0; dy < scale; ++dy) {
            set_pixel(x + static_cast<int>(index) * 6 * scale + column * scale + dx,
                      y + row * scale + dy);
          }
        }
      }
    }
  }
}

void init_display() {
  ESP_ERROR_CHECK(gpio_set_direction(kVext, GPIO_MODE_OUTPUT));
  ESP_ERROR_CHECK(gpio_set_level(kVext, 0));
  ESP_ERROR_CHECK(gpio_set_direction(kReset, GPIO_MODE_OUTPUT));
  ESP_ERROR_CHECK(gpio_set_level(kReset, 0));
  vTaskDelay(pdMS_TO_TICKS(10));
  ESP_ERROR_CHECK(gpio_set_level(kReset, 1));
  vTaskDelay(pdMS_TO_TICKS(10));

  i2c_config_t config{};
  config.mode = I2C_MODE_MASTER;
  config.sda_io_num = kSda;
  config.scl_io_num = kScl;
  config.sda_pullup_en = GPIO_PULLUP_ENABLE;
  config.scl_pullup_en = GPIO_PULLUP_ENABLE;
  config.master.clk_speed = 400000;
  ESP_ERROR_CHECK(i2c_param_config(kI2cPort, &config));
  ESP_ERROR_CHECK(i2c_driver_install(kI2cPort, config.mode, 0, 0, 0));

  const uint8_t init[] = {0xae, 0xd5, 0x80, 0xa8, 0x3f, 0xd3, 0x00, 0x40,
                          0x8d, 0x14, 0x20, 0x00, 0xa1, 0xc8, 0xda, 0x12,
                          0x81, 0xcf, 0xd9, 0xf1, 0xdb, 0x40, 0xa4, 0xa6,
                          0xaf};
  ESP_ERROR_CHECK(write_command(init, sizeof(init)));
}
}  // namespace

extern "C" void app_main() {
  ESP_LOGI(kTag, "Hello World");
  init_display();
  draw_text(34, 15, "HELLO", 2);
  draw_text(34, 37, "WORLD", 2);
  ESP_ERROR_CHECK(flush());
  ESP_LOGI(kTag, "Hello World is displayed on the OLED");
}
