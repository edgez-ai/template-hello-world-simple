Import("env")

# Keep remote toolbar uploads consistent with `pio run --target upload`.
env["ENV"]["ESPTOOL_CFGFILE"] = env.subst("$PROJECT_DIR/esptool.cfg")
