
#pragma once

#include <string>
#include <variant>

using Undefined = std::monostate;


// void operator*(Undefined) {
//     throw std::bad_variant_access();
// }

template <typename... Types>
class Union {
    std::variant<Undefined, Types...> value;

    // template <typename T>
    // struct is_shared_ptr : std::false_type {};

    // template <typename T>
    // struct is_shared_ptr<std::shared_ptr<T>> : std::true_type {};

    // template <typename T>
    // struct tmp;

    // template <typename T>
    // struct tmp<std::shared_ptr<std::vector<T>>> {
    //     using type = T;
    // };


    // template <typename T>
    // struct element<typename T> {
    //     using type = tmp<T>::type;
    // }


    // using elementType = element<Types>::type;


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

    // elementType operator*() {
    //     return std::visit([this](auto& arg) {
    //         using T = std::decay_t<decltype(arg)>;
    //         if constexpr (is_shared_ptr<T>::value) {
    //             return *std::get<T>(this->value);
    //         }
    //         throw std::bad_variant_access();
    //     }, value);
    // }
};


template <typename... Types>
bool operator==(double number, const Union<Types...>& u) {
    return u == number;
}


template <typename... Types>
bool operator!=(double number, const Union<Types...>& u) {
    return u != number;
}
