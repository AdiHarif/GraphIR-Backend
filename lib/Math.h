
#include <iostream>
#include <cmath>


class Math {
public:
    class Floor {
    public:
        template <typename T>
        double operator()(const T& t) {
            return std::floor(t);
        }
    } floor;
} Math;
