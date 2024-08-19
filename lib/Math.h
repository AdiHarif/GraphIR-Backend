
#include <iostream>
#include <cmath>


class Math {
public:
    class floor {
    public:
        template <typename T>
        double operator()(const T& t) {
            return std::floor(t);
        }
    } _floor;
} _Math;
