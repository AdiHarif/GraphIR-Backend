
#include <iostream>

#include <iostream>
#include <fstream>

#include <cassert>

class fs {
public:
    class readFileSync {
    public:
        std::string operator()(const std::string& s, const std::string& encoding) {
            assert(encoding == "utf8");
            std::ifstream file(s);
            std::string out;
            file >> out;
            return out;
        }
    } _readFileSync;
} _fs;
