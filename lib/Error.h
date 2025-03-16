
#include <stdexcept>

class Error : public std::runtime_error {
public:
    Error(): std::runtime_error("") {}
    Error(const std::string& message): std::runtime_error(message) {}
};

