
#include <string>

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
} _String;

std::string operator+(const std::string& a, double b) {
    return a + std::to_string(b);
}

std::string operator+(double a, const std::string& b) {
    return std::to_string(a) + b;
}
