file(GLOB_RECURSE SOURCES "src/*.c")
add_library(lvgl ${SOURCES})
target_include_directories(lvgl PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})
