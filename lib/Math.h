
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

    class abs {
    public:
        template <typename T>
        double operator()(const T& t) {
            return std::abs(t);
        }
    } _abs;

    class sqrt {
    public:
        template <typename T>
        double operator()(const T& t) {
            return std::sqrt(t);
        }
    } _sqrt;

    class min {
    public:
        template <typename T>
        double operator()(const T& t1, const T& t2) {
            return std::min(t1, t2);
        }
    } _min;

    class sin {
    public:
        template <typename T>
        double operator()(const T& t) {
            return std::sin(t);
        }
    } _sin;

    class cos {
    public:
        template <typename T>
        double operator()(const T& t) {
            return std::cos(t);
        }
    } _cos;

    double _PI = M_PI;

} _Math;

const double Infinity = std::numeric_limits<double>::infinity();
