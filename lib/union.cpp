
#include "union.h"

#include <stdexcept>
#include <string>


Union::Union() : tag(Undefined) {}

Union::Union(bool b) : tag(Boolean) {
    value.b = b;
}

Union::Union(double n) : tag(Number) {
    value.n = n;
}

Union::Union(const std::string& s) : tag(String) {
    constructValue(String);
    value.s = s;
}

Union::Union(const Union& other) : tag(other.tag) {
    constructValue(tag);
    switch (tag) {
        case Boolean:
            value.b = other.value.b;
            break;
        case Number:
            value.n = other.value.n;
            break;
        case String:
            value.s = other.value.s;
            break;
        case Undefined:
            break;
    }
}

Union::~Union() {
    destructValue();
}

void Union::constructValue(Tag t) {
    switch (t) {
        case String:
            new (&value.s) std::string();
            break;
    }
}

void Union::destructValue() {
    switch (tag) {
        case String:
            value.s.~basic_string();
            break;
    }
}

Union& Union::operator=(bool b) {
    destructValue();
    tag = Boolean;
    value.b = b;
    return *this;
}

Union& Union::operator=(double n) {
    destructValue();
    tag = Number;
    value.n = n;
    return *this;
}

Union& Union::operator=(const std::string& s) {
    if (tag != String) {
        destructValue();
        constructValue(String);
    }
    tag = String;
    value.s = s;
    return *this;
}

Union& Union::operator=(const Union& other) {
    if (this == &other) {
        return *this;
    }
    if (tag != other.tag) {
        destructValue();
        constructValue(other.tag);
    }
    tag = other.tag;
    switch (tag) {
        case Boolean:
            value.b = other.value.b;
            break;
        case Number:
            value.n = other.value.n;
            break;
        case String:
            value.s = other.value.s;
            break;
        case Undefined:
            break;
    }
    return *this;
}

Union::operator bool() {
    switch (tag) {
        case Boolean:
            return value.b;
        case Number:
            return value.n != 0;
        case String:
            return value.s != "";
        case Undefined:
            return false;
    }
}

bool Union::operator==(double number) const {
    switch (tag) {
        case Boolean:
            return value.b == (number != 0);
        case Number:
            return value.n == number;
        case Undefined:
            return false;
        case String:
            throw std::runtime_error("Unsupported type for comparison with number");
    }
}
