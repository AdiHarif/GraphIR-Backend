
#pragma once

#include <string>
#include <variant>

using Undefined = std::monostate;


template <typename... Types>
class Union {
    std::variant<Undefined, Types...> value;

public:

    template <typename T>
    Union& operator=(const T& arg) {
        value = arg;
        return *this;
    }

    operator bool() {
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

    bool operator==(double number) const {
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

    bool operator!=(double number) const {
        return !(*this == number);
    }
};


template <typename... Types>
bool operator==(double number, const Union<Types...>& u) {
    return u == number;
}


template <typename... Types>
bool operator!=(double number, const Union<Types...>& u) {
    return u != number;
}
