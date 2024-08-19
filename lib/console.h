
#include <iostream>

class console {
public:
    class log {
    public:
        template <typename T>
        void operator()(const T& t) {
            std::cout << t << std::endl;
        }
    } _log;
} _console;
