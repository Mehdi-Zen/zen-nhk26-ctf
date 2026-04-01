from sympy import integer_nthroot

M = 67153846793160963263450736031589016572066464826214275819731249500107870311858300643354819683924305915758693

m, exact = integer_nthroot(M, 3)  # racine cubique entière
flag = m.to_bytes((m.bit_length() + 7) // 8, "big") # passage en octet
flag = flag.decode()
print(flag)
