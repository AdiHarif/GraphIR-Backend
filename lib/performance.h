
#include <chrono>

class performance {
public:
    class now {
    public:
        double operator()() {
            std::chrono::duration<double, std::milli> d = std::chrono::high_resolution_clock::now().time_since_epoch();
            return d.count();
        }
    } _now;
} _performance;
