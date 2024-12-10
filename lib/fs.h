
#include <iostream>

#include <iostream>
#include <fstream>
#include <sstream>

#include <cassert>

class fs {
public:
    class readFileSync {
    public:
        std::string operator()(const std::string& s, const std::string& encoding) {
            assert(encoding == "utf8");
            std::stringstream outStream;
            std::ifstream file(s);
            outStream << file.rdbuf();
            return outStream.str();
        }
    } _readFileSync;
} _fs;