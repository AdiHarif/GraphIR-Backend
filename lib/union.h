
#pragma once

#include <string>
#include <variant>

using Undefined = std::monostate;

template <typename... Types>
class Union {
    std::variant<Undefined, Types...> value;

    template<typename... Ts>
    struct TypeList {};

    template<typename Typelist, typename Element>
    struct _Push;

    template<typename Typelist, typename Element>
    using Push = typename _Push<Typelist, Element>::l;

    template<typename... List, typename Element>
    struct _Push<TypeList<List...>, Element> {
        using l = TypeList<Element, List...>;
    };


    template<typename Typelist1, typename TypeList2>
    struct _Extend;

    template<typename Typelist1, typename TypeList2>
    using Extend = typename _Extend<Typelist1, TypeList2>::l;

    template<typename... List1, typename... List2>
    struct _Extend<TypeList<List1...>, TypeList<List2...>> {
        using l = TypeList<List1..., List2...>;
    };


    template<typename... Ts>
    struct _ReferencedList;

    template<typename... Ts>
    using ReferencedList = typename _ReferencedList<Ts...>::l;

    template<>
    struct _ReferencedList<> {
        using l = TypeList<>;
    };

    template<typename T, typename... Ts>
    struct _ReferencedList<T, Ts...> {
        using l = ReferencedList<Ts...>;
    };

    template<typename T, typename... Ts>
    struct _ReferencedList<std::shared_ptr<T>, Ts...> {
        using tail = ReferencedList<Ts...>;
        using l = Push<tail, T>;
    };

    template<typename... Ts>
    struct _GetReferencedTypes;

    template<typename... Ts>
    using GetReferencedTypes = typename _GetReferencedTypes<Ts...>::t;

    template<typename... Ts>
    struct _GetReferencedTypes<Union<Ts...>> {
        using l = ReferencedList<Ts...>;
        using t = GetReferencedTypes<l>;
    };

    template<typename... Ts>
    struct _GetReferencedTypes<TypeList<Ts...>> {
        using t = Union<Ts...>;
    };

    template<typename... Ts>
    struct _ElementList;

    template<typename... Ts>
    using ElementList = typename _ElementList<Ts...>::l;

    template<>
    struct _ElementList<> {
        using l = TypeList<>;
    };

    template<typename T, typename... Ts>
    struct _ElementList<T, Ts...> {
        using l = ElementList<Ts...>;
    };

    template<typename... Tss, typename... Ts>
    struct _ElementList<std::vector<Union<Tss...>>, Ts...> {
        using tail = ElementList<Ts...>;
        using l = Extend<TypeList<Tss...>, tail>;
    };

    template<typename T, typename... Ts>
    struct _ElementList<std::vector<T>, Ts...> {
        using tail = ElementList<Ts...>;
        using l = Push<tail, T>;
    };

    template<typename... Ts>
    struct _GetElementTypes;

    template<typename... Ts>
    using GetElementTypes = typename _GetElementTypes<Ts...>::t;

    template<typename... Ts>
    struct _GetElementTypes<Union<Ts...>> {
        using l = ElementList<Ts...>;
        using t = GetElementTypes<l>;
    };

    template<typename... Ts>
    struct _GetElementTypes<TypeList<Ts...>> {
        using t = Union<Ts...>;
    };


    template <typename T>
    struct IsSharedPtr : std::false_type {};

    template <typename T>
    struct IsSharedPtr<std::shared_ptr<T>> : std::true_type {};

    template <typename T>
    struct IsVector : std::false_type {};

    template <typename T>
    struct IsVector<std::vector<T>> : std::true_type {};

public:
    Union() : value() {}

    template <typename T>
    Union(const T& arg) : value(arg) {}

    template <typename T>
    Union& operator=(const T& arg) {
        value = arg;
        return *this;
    }

    operator bool() {
        return std::visit([](const auto& arg) {
            using T = std::decay_t<decltype(arg)>;
            if constexpr (std::is_same_v<T, Undefined>) {
                return false;
            }
            else {
                return true;
            }
        }, value);
    }

    bool operator==(double number) const {
        return std::visit([number](const auto& arg) {
            using T = std::decay_t<decltype(arg)>;
            if constexpr (std::is_same_v<T, Undefined>) {
                return false;
            }
            else if constexpr (std::is_same_v<T, std::string>) {
                return arg == std::to_string(number);
            }
            else {
                return arg == number;
            }
        }, value);
    }

    bool operator!=(double number) const {
        return !(*this == number);
    }

    using ReferencedType = GetReferencedTypes<Union<Types...>>;
    ReferencedType operator*() {
        return std::visit([this](auto& arg) -> ReferencedType {
            using T = std::decay_t<decltype(arg)>;
            if constexpr (IsSharedPtr<T>::value) {
                return ReferencedType(*arg);
            }
            throw std::bad_variant_access();
        }, value);
    }

    using ElementType = GetElementTypes<Union<Types...>>;
    ElementType operator[](size_t index) {
        return std::visit([index](auto& arg) -> ElementType {
            using T = std::decay_t<decltype(arg)>;
            if constexpr (IsVector<T>::value) {
                return ElementType(arg.at(index));
            }
            throw std::bad_variant_access();
        }, value);
    }
};


template <typename... Types>
bool operator==(double number, const Union<Types...>& u) {
    return u == number;
}


template <typename... Types>
bool operator!=(double number, const Union<Types...>& u) {
    return u != number;
}
