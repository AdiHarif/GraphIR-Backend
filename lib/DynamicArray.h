
#pragma once

#include <memory>
#include <vector>

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
        result.data = data;
        result.data->erase(result.data->begin(), result.data->begin() + start);
        return result;
    }
};

