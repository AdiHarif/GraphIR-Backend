
#pragma once

#include <string>

class Union {
    enum Tag {
        Boolean,
        Number,
        String,
        Undefined
    } tag;
    union Value {
        bool b;
        double n;
        std::string s;

        Value() : b(false) {}
        ~Value() {}
    } value;

    void constructValue(Tag t);
    void destructValue();

public:
    Union();
    Union(bool b);
    Union(double n);
    Union(const std::string& s);
    Union(const Union& other);
    ~Union();

    Union& operator=(bool b);
    Union& operator=(double n);
    Union& operator=(const std::string& s);
    Union& operator=(const Union& other);
    operator bool();
    bool operator==(double number) const;
};

bool operator==(double number, const Union& value);

