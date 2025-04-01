
#pragma once

#include <string>

#include "global.h"

class String {
public:
    class charCodeAt {
    public:
        char operator()(const std::string& str, size_t t) {
            return str[t];
        }
    } _charCodeAt;

    class fromCharCode {
    public:
        std::string operator()(char t) {
            return std::string(1, t);
        }
    } _fromCharCode;

    class indexOf {
    public:
        size_t operator()(const std::string& str, const std::string& searchStr, size_t fromIndex = 0) {
            return str.find(searchStr, fromIndex);
        }
    } _indexOf;

} _String;

std::string operator+(const std::string& a, double b) {
    return a + std::to_string(b);
}

std::string operator+(double a, const std::string& b) {
    return std::to_string(a) + b;
}

bool operator<(const std::string& a, int64_t b) {
    return parseInt(a) < b;
}

bool operator<(int64_t a, const std::string& b) {
    return a < parseInt(b);
}

bool operator>(const std::string& a, int64_t b) {
    return parseInt(a) > b;
}
bool operator>(int64_t a, const std::string& b) {
    return a > parseInt(b);
}
