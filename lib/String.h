
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
