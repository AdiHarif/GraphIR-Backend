
#pragma once

#include <memory>
#include <vector>
#include <sstream>

template <typename T>
class DynamicArray {
    std::shared_ptr<std::vector<T>> data;

public:
    DynamicArray() = default;
    DynamicArray(size_t size): data(std::make_shared<std::vector<T>>(size)) {}
    DynamicArray(std::initializer_list<T> list): data(std::make_shared<std::vector<T>>(list)) {}

    T& operator[](size_t i) {
        return data->at(i);
    }

    size_t size() const {
        return data->size();
    }

    DynamicArray<T> slice(size_t start) {
        DynamicArray<T> result;
        result.data = std::make_shared<std::vector<T>>(this->data->begin() + start, this->data->end());
        return result;
    }

    std::string join(const std::string& separator) {
        std::stringstream s;
        for (size_t i = 0; i < data->size(); i++) {
            if (i > 0) {
                s << separator;
            }
            s << data->at(i);
        }
        return s.str();
    }
};

