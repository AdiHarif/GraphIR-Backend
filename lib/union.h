
#pragma once

#include <string>
#include <variant>

using Undefined = std::monostate;

class Union {
    std::variant<std::monostate, double, std::string> value;

public:

    template <typename T>
    Union& operator=(const T& arg) {
        value = arg;
        return *this;
    }

    operator bool();
    bool operator==(double number) const;
    bool operator!=(double number) const;
};

bool operator==(double number, const Union& u);
bool operator!=(double number, const Union& u);

