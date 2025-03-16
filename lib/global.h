
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

template <typename T>
bool _strictEquals(const T& a, const T& b) {
    return a == b;
}

template <typename T>
bool _strictNotEquals(const T& a, const T& b) {
    return a != b;
}
