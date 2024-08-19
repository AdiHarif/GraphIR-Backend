
#include <iostream>

class Console {
public:
    class Log {
    public:
        template <typename T>
        void operator()(const T& t) {
            std::cout << t << std::endl;
        }
    } log;
} console;
