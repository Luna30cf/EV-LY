cmake_minimum_required(VERSION 3.12.4)
project(lvgl_mqtt_login C)

set(CMAKE_C_STANDARD 99)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_SOURCE_DIR}/bin)

add_subdirectory(lvgl)

include_directories(
    ${CMAKE_SOURCE_DIR}
    ${CMAKE_SOURCE_DIR}/main/inc
    ${CMAKE_SOURCE_DIR}/lvgl
    ${CMAKE_SOURCE_DIR}/lvgl/src
)

find_package(PkgConfig REQUIRED)
pkg_check_modules(SDL2 REQUIRED sdl2)

include_directories(${SDL2_INCLUDE_DIRS})
link_directories(${SDL2_LIBRARY_DIRS})

add_executable(main
    ${LVGL_SOURCES}
    main/src/main.c
    main/src/login_ui.c
    main/src/mqtt_client.c
)

target_link_libraries(main
    ${SDL2_LIBRARIES}
    paho-mqtt3c.dll.a
    m
    pthread
)

target_compile_definitions(main PRIVATE LV_CONF_INCLUDE_SIMPLE)
