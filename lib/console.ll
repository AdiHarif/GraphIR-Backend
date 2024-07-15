
declare i32 @puts(ptr)

define void @console_log(ptr) {
    call i32 @puts(ptr %0)
    ret void
}
