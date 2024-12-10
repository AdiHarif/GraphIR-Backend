
#pragma once

#include "DynamicArray.h"

class process {
public:
    static DynamicArray<std::string> _argv;

    static void initializeArgv(int argc, char** argv) {
        _argv = DynamicArray<std::string>(argc+1);
        _argv[0] = "";
        for (int i = 0; i < argc; i++) {
            _argv[i+1] = argv[i];
        }
    }
} _process;

DynamicArray<std::string> process::_argv = DynamicArray<std::string>();
