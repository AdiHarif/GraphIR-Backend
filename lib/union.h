
#pragma once

#include <string>
#include <variant>
#include <ostream>

#include "DynamicArray.h"

using Undefined = std::monostate;

template <typename... Types>
class Union {
    std::variant<Undefined, Types...> value;

    template<typename... Ts>
    struct _GetElementTypes;

    template<typename... Ts>
    using GetElementTypes = typename _GetElementTypes<Ts...>::t;

    template<typename T, typename... Ts>
    struct _GetElementTypes<T, Ts...> {
        using t = GetElementTypes<Ts...>;
    };

    template<typename T, typename... Ts>
    struct _GetElementTypes<DynamicArray<T>, Ts...> {
        using t = T;
    };

    template<>
    struct _GetElementTypes<> {
        using t = Undefined;
    };

    template <typename T>
    struct IsSharedPtr : std::false_type {};

    template <typename T>
    struct IsSharedPtr<std::shared_ptr<T>> : std::true_type {};

    template <typename T>
    struct IsDynamicArray : std::false_type {};

    template <typename T>
    struct IsDynamicArray<DynamicArray<T>> : std::true_type {};

public:
    Union() : value() {}

    template <typename T>
    Union(const T& arg) : value(arg) {}

    template <typename T>
    Union& operator=(const T& arg) {
        value = arg;
        return *this;
    }

    explicit operator bool() {
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

    operator double() {
        return std::visit([](const auto& arg) -> double {
            using T = std::decay_t<decltype(arg)>;
            if constexpr (std::is_same_v<T, double>) {
                return arg;
            }
            else {
                throw std::bad_variant_access();
            }
        }, value);
    }

    using ElementType = GetElementTypes<Types...>;
    ElementType& operator[](size_t index) {
        return std::visit([index](auto& arg) -> ElementType& {
            using T = std::decay_t<decltype(arg)>;
            if constexpr (IsDynamicArray<T>::value) {
                return arg[index];
            }
            throw std::bad_variant_access();
        }, value);
    }

    template <typename... Types1, typename... Types2>
    friend bool operator==(const Union<Types1...>& u1, const Union<Types2...>& u2);

    template <typename... Types1>
    friend std::ostream& operator<<(std::ostream& os, const Union<Types1...>& u);
};


template <typename... Types, typename T>
bool operator==(const T& val, const Union<Types...>& u) {
    return u == Union<T>(val);
}

template <typename... Types, typename T>
bool operator==(const Union<Types...>& u, const T& val) {
    return u == Union<T>(val);
}

template <typename... Types, typename T>
bool operator!=(const T& val, const Union<Types...>& u) {
    return u != Union<T>(val);
}

template <typename... Types, typename T>
bool operator!=(const Union<Types...>& u, const T& val) {
    return u != Union<T>(val);
}


template <typename T>
bool operator==(const Undefined&, const T&) {
    return false;
}

template <typename T>
bool operator==(const T&, const Undefined&) {
    return false;
}

bool operator==(double n, const std::string& s) {
    return s == std::to_string(n);
}

bool operator==(const std::string& s, double n) {
    return n == s;
}

template <typename... Types1, typename... Types2>
bool operator==(const Union<Types1...>& u1, const Union<Types2...>& u2) {
    return std::visit([&u2](const auto& arg) {
        return std::visit([&arg](const auto& otherArg) {
            return arg == otherArg;
        }, u2.value);
    }, u1.value);
}

template <typename... Types1, typename... Types2>
bool operator!=(const Union<Types1...>& u1, const Union<Types2...>& u2) {
    return !(u1 == u2);
}

std::ostream& operator<<(std::ostream& os, const Undefined&) {
    return os << "undefined";
}

template <typename... Types>
std::ostream& operator<<(std::ostream& os, const Union<Types...>& u) {
    return std::visit([&os](const auto& arg) -> std::ostream& {
        return os << arg;
    }, u.value);
}
