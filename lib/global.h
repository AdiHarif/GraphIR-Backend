
#pragma once

#include <string>
#include <cstdint>
#include <stdexcept>

#include "union.h"

int64_t parseInt(const std::string& s, int base = 10) {
    return std::stol(s, nullptr, base);
}

void assert(bool b) {
    if (!b) {
        throw std::runtime_error("Assertion failed");
    }
}


template <typename T, typename S>
bool _strictEquals(const T& a, const S& b) {
    if constexpr (Union<T>::template IsUnion<std::decay_t<T>>::value) {
        return visit([&](auto&& value) {
            return _strictEquals(value, b);
        }, a.value);
    }
    else if constexpr (Union<S>::template IsUnion<std::decay_t<S>>::value) {
        return visit([&](auto&& value) {
            return _strictEquals(a, value);
        }, b.value);
    }
    else if constexpr (std::is_same_v<std::decay_t<T>, std::decay_t<S>>) {
        return a == b;
    }
    else if constexpr (std::is_same_v<std::decay_t<T>, int64_t> && std::is_same_v<std::decay_t<S>, double>) {
        return static_cast<double>(a) == b;
    }
    else if constexpr (std::is_same_v<std::decay_t<T>, double> && std::is_same_v<std::decay_t<S>, int64_t>) {
        return a == static_cast<double>(b);
    }
    else {
        return false;
    }
}

template <typename T, typename S>
bool _strictNotEquals(const T& a, const S& b) {
    return !_strictEquals(a, b);
}
