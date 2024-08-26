
#include "union.h"

#include <stdexcept>
#include <string>


Union::operator bool() {
    return std::visit([](const auto& arg) {
        using T = std::decay_t<decltype(arg)>;
        if constexpr (std::is_same_v<T, Undefined>) {
            return false;
        }
        else {
            return true;
        }
    }, value);
}

bool Union::operator==(double number) const {
    return std::visit([number](const auto& arg) {
        using T = std::decay_t<decltype(arg)>;
        if constexpr (std::is_same_v<T, Undefined>) {
            return false;
        }
        else if constexpr (std::is_same_v<T, std::string>) {
            return arg == std::to_string(number);
        }
        else {
            return arg == number;
        }
    }, value);
}

bool Union::operator!=(double number) const {
    return !(*this == number);
}

bool operator==(double number, const Union& u) {
    return u == number;
}

bool operator!=(double number, const Union& u) {
    return !(u == number);
}
