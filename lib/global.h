
#include <string>
#include <cstdint>
#include <stdexcept>

int64_t parseInt(const std::string& s) {
    return std::stol(s);
}

void assert(bool b) {
    if (!b) {
        throw std::runtime_error("Assertion failed");
    }
}
