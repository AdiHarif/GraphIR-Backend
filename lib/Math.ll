
declare double @llvm.floor.f64(double)

define double @Math_floor(double) {
    %r0 = call double @llvm.floor.f64(double %0)
    ret double %r0
}
