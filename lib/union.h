
#pragma once

#include <string>
#include <variant>
#include <ostream>
#include <cmath>

#include "DynamicArray.h"

template <typename T, typename... Ts>
constexpr bool contains_type_v = std::disjunction_v<std::is_same<T, Ts>...>;

using Undefined = std::monostate;
using Null = std::monostate;

template <typename T>
double operator+(const T&, Undefined) {
    return NAN;
}

template <typename T>
double operator+(Undefined, const T&) {
    return NAN;
}

double operator+(Undefined, Undefined) {
    return NAN;
}

template <typename T>
double operator*(const T&, Undefined) {
    return NAN;
}

template <typename T>
double operator*(Undefined, const T&) {
    return NAN;
}

double operator*(Undefined, Undefined) {
    return NAN;
}

template <typename T>
bool operator<(const T&, Undefined) {
    return false;
}

template <typename T>
bool operator<(Undefined, const T&) {
    return false;
}

template <typename... Types>
class Union {
    std::variant<Types...> value;

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
        using t = T&;
    };

    template<typename... Ts>
    struct _GetElementTypes<std::string, Ts...> {
        using t = char;
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

    template <typename T>
    struct IsUnion : std::false_type {};

    template <typename... Ts>
    struct IsUnion<Union<Ts...>> : std::true_type {};

public:
    Union() : value() {
        if constexpr (contains_type_v<Undefined, Types...>) {
            value = Undefined();
        }
    }

    template <typename T>
    Union(const T& arg) : value(arg) {}

    template <typename T>
    Union& operator=(T&& arg) {
        if constexpr (std::is_same_v<std::decay_t<T>, Union>) {
            value = arg.value;
        }
        else if constexpr (IsUnion<std::decay_t<T>>::value) {
            visit([this](auto& arg) {
                value = arg;
            }, arg.value);
        }
        else if constexpr (contains_type_v<double, Types...> && std::is_same_v<std::decay_t<T>, int64_t>) {
            value = (double)arg;
        }
        else {
            value = arg;
        }
        return *this;
    }

    Union& operator=(double arg) {
        if constexpr (contains_type_v<double, Types...>) {
            value = arg;
        }
        else if constexpr (contains_type_v<int64_t, Types...>) {
            value = static_cast<int64_t>(arg);
        }
        else {
            throw std::bad_variant_access();
        }
        return *this;
    }

    explicit operator bool() const {
        return std::visit([](const auto& arg) -> bool {
            using T = std::decay_t<decltype(arg)>;
            if constexpr (std::is_same_v<T, Undefined>) {
                return false;
            }
            else {
                return arg;
            }
        }, value);
    }

    operator double() const {
        return std::visit([](const auto& arg) -> double {
            using T = std::decay_t<decltype(arg)>;
            if constexpr (std::is_same_v<T, double>) {
                return arg;
            }
            else if constexpr (std::is_same_v<T, int64_t>) {
                return static_cast<double>(arg);
            }
            else {
                throw std::bad_variant_access();
            }
        }, value);
    }

    operator std::string() const {
        return std::visit([](const auto& arg) -> std::string {
            using T = std::decay_t<decltype(arg)>;
            if constexpr (std::is_same_v<T, std::string>) {
                return arg;
            }
            else {
                return std::to_string(arg);
            }
        }, value);
    }

    using ElementType = GetElementTypes<Types...>;
    ElementType operator[](size_t index) {
        return std::visit([index](auto& arg) -> ElementType {
            using T = std::decay_t<decltype(arg)>;
            if constexpr (IsDynamicArray<T>::value || std::is_same_v<T, std::string>) {
                return arg[index];
            }
            throw std::bad_variant_access();
        }, value);
    }

    size_t size() {
        return std::visit([](auto& arg) -> size_t {
            using T = std::decay_t<decltype(arg)>;
            if constexpr (IsDynamicArray<T>::value || std::is_same_v<T, std::string>) {
                return arg.size();
            }
            throw std::bad_variant_access();
        }, value);
    }

    template <typename... Types1, typename... S>
    friend bool operator==(const Union<Types1...>& u1, const Union<S...>& u2);

    template <typename... Ts1, typename... Ts2>
    friend auto operator+(const Union<Ts1...>& u, const Union<Ts2...>& v);

    template <typename T, typename... Types1>
    friend std::ostream& operator<<(std::ostream& os, const Union<T, Types1...>& u);

    template <typename... OtherTypes>
    friend class Union;

    template <typename T, typename S>
    friend bool _strictEquals(const T& a, const S& b);
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

template <typename... Ts1, typename... Ts2>
auto operator+(const Union<Ts1...>& u, const Union<Ts2...>& v) {
    return visit([v](const auto& arg) {
        return visit([&arg](const auto& otherArg) {
            return arg + otherArg;
        }, v.value);
    }, u.value);
}

template <typename... Types>
auto operator+(const Union<Types...>& u, double n) {
    return (double)u + n;
}

template <typename... Types>
auto operator+(const Union<Types...>& u, int64_t n) {
    return (double)u + n;
}


template <typename... Types1, typename... S>
bool operator==(const Union<Types1...>& u1, const Union<S...>& u2) {
    return std::visit([&u2](const auto& arg) {
        return std::visit([&arg](const auto& otherArg) {
            return arg == otherArg;
        }, u2.value);
    }, u1.value);
}

template <typename... Types1, typename... S>
bool operator!=(const Union<Types1...>& u1, const Union<S...>& u2) {
    return !(u1 == u2);
}

std::ostream& operator<<(std::ostream& os, const Undefined&) {
    return os << "undefined";
}

template <typename T, typename... Types>
std::ostream& operator<<(std::ostream& os, const Union<T, Types...>& u) {
    return std::visit([&os](const auto& arg) -> std::ostream& {
        return os << arg;
    }, u.value);
}
