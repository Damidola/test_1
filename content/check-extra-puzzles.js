/* Навчальні позиції: укриття, відкриті лінії, захищені шахи та взяття. */
export const CHECK_EXTRAS = {
  "rook": [
    {
      "id": "lesson-rook-103",
      "motif": "Шах під захистом",
      "white": "Rf2 Kg3 Pf4",
      "black": "Nb4 Kh6",
      "solution": "f2h2",
      "hint": "Король на h6. Знайди безпечний шлях на його вертикаль.",
      "capture": false,
      "explanation": "Тура з f2 стала на h2 та оголосила шах королю h6. Її прикриває своя фігура."
    },
    {
      "id": "lesson-rook-109",
      "motif": "Відкрита горизонталь",
      "white": "Kb2 Bh2 Pa3 Rc4",
      "black": "Kh8",
      "solution": "c4c8",
      "hint": "Король на h8. Знайди безпечний шлях на його горизонталь.",
      "capture": false,
      "explanation": "Тура з c4 стала на c8 та оголосила шах королю h8. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-rook-126",
      "motif": "Відкрита горизонталь",
      "white": "Kd2 Pc3 Rh6",
      "black": "Pf7 Kf8",
      "solution": "h6h8",
      "hint": "Король на f8. Знайди безпечний шлях на його горизонталь.",
      "capture": false,
      "explanation": "Тура з h6 стала на h8 та оголосила шах королю f8. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-rook-5",
      "motif": "Шах під захистом",
      "white": "Re3 Kg3 Pf4 Bf5",
      "black": "Ka5",
      "solution": "e3e5",
      "hint": "Король на a5. Знайди безпечний шлях на його горизонталь.",
      "capture": false,
      "explanation": "Тура з e3 стала на e5 та оголосила шах королю a5. Її прикриває своя фігура."
    },
    {
      "id": "lesson-rook-15",
      "motif": "Відкрита горизонталь",
      "white": "Ka1 Rf4",
      "black": "Pd5 Pc6 Kd6",
      "solution": "f4f6",
      "hint": "Король на d6. Знайди безпечний шлях на його горизонталь.",
      "capture": false,
      "explanation": "Тура з f4 стала на f6 та оголосила шах королю d6. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-rook-102",
      "motif": "Взяття з шахом",
      "white": "Ka3 Rc6 Rd6",
      "black": "Ph5 Pg6 Kh6",
      "solution": "d6g6",
      "hint": "Побий фігуру так, щоб одночасно напасти на короля h6.",
      "capture": true,
      "explanation": "Тура з d6 стала на g6 із взяттям та оголосила шах королю h6. Її прикриває своя фігура."
    },
    {
      "id": "lesson-rook-37",
      "motif": "Відкрита вертикаль",
      "white": "Rg2 Kg3 Ph4",
      "black": "Pd4 Kc5 Rf7",
      "solution": "g2c2",
      "hint": "Король на c5. Знайди безпечний шлях на його вертикаль.",
      "capture": false,
      "explanation": "Тура з g2 стала на c2 та оголосила шах королю c5. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-rook-105",
      "motif": "Взяття з шахом",
      "white": "Re2 Kg3 Ph4",
      "black": "Pb6 Ka7 Ne7",
      "solution": "e2e7",
      "hint": "Побий фігуру так, щоб одночасно напасти на короля a7.",
      "capture": true,
      "explanation": "Тура з e2 стала на e7 із взяттям та оголосила шах королю a7. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-rook-84",
      "motif": "Відкрита вертикаль",
      "white": "Kf2 Rf3 Pg3 Bf7",
      "black": "Pb6 Ka7",
      "solution": "f3a3",
      "hint": "Король на a7. Знайди безпечний шлях на його вертикаль.",
      "capture": false,
      "explanation": "Тура з f3 стала на a3 та оголосила шах королю a7. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-rook-27",
      "motif": "Шах під захистом",
      "white": "Rg2 Kh2 Be6",
      "black": "Pc3 Kd4 Nb7",
      "solution": "g2g4",
      "hint": "Король на d4. Знайди безпечний шлях на його горизонталь.",
      "capture": false,
      "explanation": "Тура з g2 стала на g4 та оголосила шах королю d4. Її прикриває своя фігура."
    },
    {
      "id": "lesson-rook-44",
      "motif": "Відкрита вертикаль",
      "white": "Ka3 Rb3 Pb4",
      "black": "Pc5 Pe5 Kd6 Be7",
      "solution": "b3d3",
      "hint": "Король на d6. Знайди безпечний шлях на його вертикаль.",
      "capture": false,
      "explanation": "Тура з b3 стала на d3 та оголосила шах королю d6. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-rook-10",
      "motif": "Відкрита горизонталь",
      "white": "Ke1 Pd2 Pf2 Rh5",
      "black": "Pf6 Ra7 Ke7",
      "solution": "h5h7",
      "hint": "Король на e7. Знайди безпечний шлях на його горизонталь.",
      "capture": false,
      "explanation": "Тура з h5 стала на h7 та оголосила шах королю e7. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-rook-11",
      "motif": "Шах під захистом",
      "white": "Rb2 Kg3 Ph4 Pc5",
      "black": "Pg5 Kh6 Na7",
      "solution": "b2b6",
      "hint": "Король на h6. Знайди безпечний шлях на його горизонталь.",
      "capture": false,
      "explanation": "Тура з b2 стала на b6 та оголосила шах королю h6. Її прикриває своя фігура."
    },
    {
      "id": "lesson-rook-87",
      "motif": "Відкрита вертикаль",
      "white": "Kb2 Pa3 Pc3 Pd3 Re6",
      "black": "Pg3 Kh4",
      "solution": "e6h6",
      "hint": "Король на h4. Знайди безпечний шлях на його вертикаль.",
      "capture": false,
      "explanation": "Тура з e6 стала на h6 та оголосила шах королю h4. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-rook-110",
      "motif": "Відкрита горизонталь",
      "white": "Ke1 Pd2 Be2 Rf2",
      "black": "Pc5 Pe5 Kd6 Bh6",
      "solution": "f2f6",
      "hint": "Король на d6. Знайди безпечний шлях на його горизонталь.",
      "capture": false,
      "explanation": "Тура з f2 стала на f6 та оголосила шах королю d6. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-rook-16",
      "motif": "Шах під захистом",
      "white": "Kc3 Pb4 Pd4 Ra5 Rd5",
      "black": "Pg3 Kh4 Be7",
      "solution": "d5h5",
      "hint": "Король на h4. Знайди безпечний шлях на його вертикаль.",
      "capture": false,
      "explanation": "Тура з d5 стала на h5 та оголосила шах королю h4. Її прикриває своя фігура."
    },
    {
      "id": "lesson-rook-62",
      "motif": "Відкрита вертикаль",
      "white": "Kc1 Pd2 Rh6 Rb7",
      "black": "Pf3 Bd4 Kf4 Pg4",
      "solution": "b7f7",
      "hint": "Король на f4. Знайди безпечний шлях на його вертикаль.",
      "capture": false,
      "explanation": "Тура з b7 стала на f7 та оголосила шах королю f4. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-rook-80",
      "motif": "Взяття з шахом",
      "white": "Kg1 Rb2 Pf2 Ph2 Ba4",
      "black": "Pc4 Pb5 Kc5 Rf5",
      "solution": "b2b5",
      "hint": "Побий фігуру так, щоб одночасно напасти на короля c5.",
      "capture": true,
      "explanation": "Тура з b2 стала на b5 із взяттям та оголосила шах королю c5. Її прикриває своя фігура."
    }
  ],
  "bishop": [
    {
      "id": "lesson-bishop-106",
      "motif": "Відкрита діагональ",
      "white": "Kd2 Ba3 Bc3 Pe3",
      "black": "Kh6",
      "solution": "a3f8",
      "hint": "Король на h6. Знайди безпечний шлях на його діагональ.",
      "capture": false,
      "explanation": "Слон з a3 стала на f8 та оголосила шах королю h6. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-bishop-57",
      "motif": "Взяття з шахом",
      "white": "Kd2 Pc3 Be3",
      "black": "Nc5 Ka7",
      "solution": "e3c5",
      "hint": "Побий фігуру так, щоб одночасно напасти на короля a7.",
      "capture": true,
      "explanation": "Слон з e3 стала на c5 із взяттям та оголосила шах королю a7. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-bishop-90",
      "motif": "Шах під захистом",
      "white": "Bh2 Kc3 Pd4",
      "black": "Ba6 Kh8",
      "solution": "h2e5",
      "hint": "Король на h8. Знайди безпечний шлях на його діагональ.",
      "capture": false,
      "explanation": "Слон з h2 стала на e5 та оголосила шах королю h8. Її прикриває своя фігура."
    },
    {
      "id": "lesson-bishop-109",
      "motif": "Відкрита діагональ",
      "white": "Kh2 Ba5",
      "black": "Pf4 Ph4 Kg5",
      "solution": "a5d8",
      "hint": "Король на g5. Знайди безпечний шлях на його діагональ.",
      "capture": false,
      "explanation": "Слон з a5 стала на d8 та оголосила шах королю g5. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-bishop-121",
      "motif": "Відкрита діагональ",
      "white": "Bb2 Ka3 Ba4",
      "black": "Pb7 Kb8",
      "solution": "b2e5",
      "hint": "Король на b8. Знайди безпечний шлях на його діагональ.",
      "capture": false,
      "explanation": "Слон з b2 стала на e5 та оголосила шах королю b8. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-bishop-114",
      "motif": "Взяття з шахом",
      "white": "Bb2 Ka3 Pb4",
      "black": "Nf6 Pc7 Kd8",
      "solution": "b2f6",
      "hint": "Побий фігуру так, щоб одночасно напасти на короля d8.",
      "capture": true,
      "explanation": "Слон з b2 стала на f6 із взяттям та оголосила шах королю d8. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-bishop-149",
      "motif": "Шах під захистом",
      "white": "Kc1 Pd2 Bh4 Rd6",
      "black": "Pa4 Ka5",
      "solution": "h4d8",
      "hint": "Король на a5. Знайди безпечний шлях на його діагональ.",
      "capture": false,
      "explanation": "Слон з h4 стала на d8 та оголосила шах королю a5. Її прикриває своя фігура."
    },
    {
      "id": "lesson-bishop-117",
      "motif": "Взяття з шахом",
      "white": "Ke1 Pd2 Be5 Rc7",
      "black": "Pg7 Kh8",
      "solution": "e5g7",
      "hint": "Побий фігуру так, щоб одночасно напасти на короля h8.",
      "capture": true,
      "explanation": "Слон з e5 стала на g7 із взяттям та оголосила шах королю h8. Її прикриває своя фігура."
    },
    {
      "id": "lesson-bishop-155",
      "motif": "Шах під захистом",
      "white": "Kc1 Pb2 Pd2 Ba5",
      "black": "Ph7 Kh8",
      "solution": "a5c3",
      "hint": "Король на h8. Знайди безпечний шлях на його діагональ.",
      "capture": false,
      "explanation": "Слон з a5 стала на c3 та оголосила шах королю h8. Її прикриває своя фігура."
    },
    {
      "id": "lesson-bishop-101",
      "motif": "Відкрита діагональ",
      "white": "Ka3 Bb4",
      "black": "Pe3 Pg3 Kf4 Bh6",
      "solution": "b4d6",
      "hint": "Король на f4. Знайди безпечний шлях на його діагональ.",
      "capture": false,
      "explanation": "Слон з b4 стала на d6 та оголосила шах королю f4. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-bishop-119",
      "motif": "Шах під захистом",
      "white": "Ka3 Bb4 Bc5",
      "black": "Pf5 Kf6 Pg6 Ba7",
      "solution": "c5e7",
      "hint": "Король на f6. Знайди безпечний шлях на його діагональ.",
      "capture": false,
      "explanation": "Слон з c5 стала на e7 та оголосила шах королю f6. Її прикриває своя фігура."
    },
    {
      "id": "lesson-bishop-147",
      "motif": "Взяття з шахом",
      "white": "Kd2 Pe3 Bd4 Ra7",
      "black": "Ng3 Pg7 Kf8",
      "solution": "d4g7",
      "hint": "Побий фігуру так, щоб одночасно напасти на короля f8.",
      "capture": true,
      "explanation": "Слон з d4 стала на g7 із взяттям та оголосила шах королю f8. Її прикриває своя фігура."
    },
    {
      "id": "lesson-bishop-1",
      "motif": "Відкрита діагональ",
      "white": "Kc3 Pb4 Bc5 Pg6",
      "black": "Nh2 Ph5 Kh6",
      "solution": "c5f8",
      "hint": "Король на h6. Знайди безпечний шлях на його діагональ.",
      "capture": false,
      "explanation": "Слон з c5 стала на f8 та оголосила шах королю h6. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-bishop-140",
      "motif": "Шах під захистом",
      "white": "Kh2 Pg3 Bh6 Rf7",
      "black": "Bc2 Pb7 Kb8",
      "solution": "h6f4",
      "hint": "Король на b8. Знайди безпечний шлях на його діагональ.",
      "capture": false,
      "explanation": "Слон з h6 стала на f4 та оголосила шах королю b8. Її прикриває своя фігура."
    },
    {
      "id": "lesson-bishop-100",
      "motif": "Відкрита діагональ",
      "white": "Kg1 Bb2 Pf2 Ph2",
      "black": "Ra5 Pb5 Kb6 Pc6",
      "solution": "b2d4",
      "hint": "Король на b6. Знайди безпечний шлях на його діагональ.",
      "capture": false,
      "explanation": "Слон з b2 стала на d4 та оголосила шах королю b6. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-bishop-111",
      "motif": "Шах під захистом",
      "white": "Kc1 Pb2 Pd2 Bc5 Rf7",
      "black": "Pg4 Pf5 Kg5",
      "solution": "c5e7",
      "hint": "Король на g5. Знайди безпечний шлях на його діагональ.",
      "capture": false,
      "explanation": "Слон з c5 стала на e7 та оголосила шах королю g5. Її прикриває своя фігура."
    },
    {
      "id": "lesson-bishop-116",
      "motif": "Відкрита діагональ",
      "white": "Ke1 Pd2 Pf2 Bf3 Bd6",
      "black": "Ph5 Kh6 Nd7",
      "solution": "d6f4",
      "hint": "Король на h6. Знайди безпечний шлях на його діагональ.",
      "capture": false,
      "explanation": "Слон з d6 стала на f4 та оголосила шах королю h6. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-bishop-148",
      "motif": "Шах під захистом",
      "white": "Ke3 Pd4 Pf4 Bg5 Bg7",
      "black": "Bg2 Pc6 Kc7 Pd7",
      "solution": "g7e5",
      "hint": "Король на c7. Знайди безпечний шлях на його діагональ.",
      "capture": false,
      "explanation": "Слон з g7 стала на e5 та оголосила шах королю c7. Її прикриває своя фігура."
    }
  ],
  "queen": [
    {
      "id": "lesson-queen-111",
      "motif": "Відкрита діагональ",
      "white": "Kb2 Qd2 Pc3",
      "black": "Pd7 Kd8",
      "solution": "d2g5",
      "hint": "Король на d8. Знайди безпечний шлях на його діагональ.",
      "capture": false,
      "explanation": "Ферзь з d2 стала на g5 та оголосила шах королю d8. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-queen-113",
      "motif": "Відкрита горизонталь",
      "white": "Kf2 Pg3 Qe4",
      "black": "Pd7 Kd8",
      "solution": "e4a8",
      "hint": "Король на d8. Знайди безпечний шлях на його горизонталь.",
      "capture": false,
      "explanation": "Ферзь з e4 стала на a8 та оголосила шах королю d8. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-queen-13",
      "motif": "Шах під захистом",
      "white": "Ka1 Qf2 Pb4",
      "black": "Pf7 Kf8",
      "solution": "f2c5",
      "hint": "Король на f8. Знайди безпечний шлях на його діагональ.",
      "capture": false,
      "explanation": "Ферзь з f2 стала на c5 та оголосила шах королю f8. Її прикриває своя фігура."
    },
    {
      "id": "lesson-queen-140",
      "motif": "Взяття з шахом",
      "white": "Ka1 Qe2",
      "black": "Nb2 Pc5 Kb6",
      "solution": "e2b2",
      "hint": "Побий фігуру так, щоб одночасно напасти на короля b6.",
      "capture": true,
      "explanation": "Ферзь з e2 стала на b2 із взяттям та оголосила шах королю b6. Її прикриває своя фігура."
    },
    {
      "id": "lesson-queen-123",
      "motif": "Відкрита діагональ",
      "white": "Kh2 Qc6",
      "black": "Pg4 Pf5 Kg5",
      "solution": "c6c1",
      "hint": "Король на g5. Знайди безпечний шлях на його діагональ.",
      "capture": false,
      "explanation": "Ферзь з c6 стала на c1 та оголосила шах королю g5. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-queen-103",
      "motif": "Відкрита вертикаль",
      "white": "Kh2 Qf5 Rd7",
      "black": "Pc7 Nf7 Kb8",
      "solution": "f5b5",
      "hint": "Король на b8. Знайди безпечний шлях на його вертикаль.",
      "capture": false,
      "explanation": "Ферзь з f5 стала на b5 та оголосила шах королю b8. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-queen-100",
      "motif": "Відкрита горизонталь",
      "white": "Qd2 Kf2 Pe3 Bb4",
      "black": "Pa6 Ka7",
      "solution": "d2d7",
      "hint": "Король на a7. Знайди безпечний шлях на його горизонталь.",
      "capture": false,
      "explanation": "Ферзь з d2 стала на d7 та оголосила шах королю a7. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-queen-169",
      "motif": "Відкрита вертикаль",
      "white": "Kb2 Qc3 Rd4",
      "black": "Pf6 Rd7 Kg7",
      "solution": "c3g3",
      "hint": "Король на g7. Знайди безпечний шлях на його вертикаль.",
      "capture": false,
      "explanation": "Ферзь з c3 стала на g3 та оголосила шах королю g7. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-queen-17",
      "motif": "Взяття з шахом",
      "white": "Kh2 Qg3 Pd5",
      "black": "Bg5 Pc7 Kd8",
      "solution": "g3g5",
      "hint": "Побий фігуру так, щоб одночасно напасти на короля d8.",
      "capture": true,
      "explanation": "Ферзь з g3 стала на g5 із взяттям та оголосила шах королю d8. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-queen-179",
      "motif": "Шах під захистом",
      "white": "Kg1 Pf2 Qe6",
      "black": "Ph5 Pg6 Kh6",
      "solution": "e6e3",
      "hint": "Король на h6. Знайди безпечний шлях на його діагональ.",
      "capture": false,
      "explanation": "Ферзь з e6 стала на e3 та оголосила шах королю h6. Її прикриває своя фігура."
    },
    {
      "id": "lesson-queen-1",
      "motif": "Взяття з шахом",
      "white": "Ke3 Qg3 Pd4 Pb6",
      "black": "Bg6 Pc7 Kb8",
      "solution": "g3c7",
      "hint": "Побий фігуру так, щоб одночасно напасти на короля b8.",
      "capture": true,
      "explanation": "Ферзь з g3 стала на c7 із взяттям та оголосила шах королю b8. Її прикриває своя фігура."
    },
    {
      "id": "lesson-queen-10",
      "motif": "Відкрита діагональ",
      "white": "Ke1 Pd2 Pf2 Qg2",
      "black": "Pf4 Ke5 Na6",
      "solution": "g2g7",
      "hint": "Король на e5. Знайди безпечний шлях на його діагональ.",
      "capture": false,
      "explanation": "Ферзь з g2 стала на g7 та оголосила шах королю e5. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-queen-101",
      "motif": "Відкрита горизонталь",
      "white": "Ka3 Pb4 Rb5 Qc5",
      "black": "Ne5 Pg7 Kh8",
      "solution": "c5f8",
      "hint": "Король на h8. Знайди безпечний шлях на його горизонталь.",
      "capture": false,
      "explanation": "Ферзь з c5 стала на f8 та оголосила шах королю h8. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-queen-105",
      "motif": "Відкрита вертикаль",
      "white": "Pc2 Kd2 Pc3 Qc6",
      "black": "Pa4 Ka5 Pb5",
      "solution": "c6a8",
      "hint": "Король на a5. Знайди безпечний шлях на його вертикаль.",
      "capture": false,
      "explanation": "Ферзь з c6 стала на a8 та оголосила шах королю a5. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-queen-115",
      "motif": "Шах під захистом",
      "white": "Qg2 Kc3 Be3 Pb4",
      "black": "Pf5 Bb6 Pe6 Kf6",
      "solution": "g2g5",
      "hint": "Король на f6. Знайди безпечний шлях на його діагональ.",
      "capture": false,
      "explanation": "Ферзь з g2 стала на g5 та оголосила шах королю f6. Її прикриває своя фігура."
    },
    {
      "id": "lesson-queen-106",
      "motif": "Відкрита діагональ",
      "white": "Kb2 Pa3 Pc3 Qe4",
      "black": "Ph3 Pg4 Kh4 Ra7",
      "solution": "e4e1",
      "hint": "Король на h4. Знайди безпечний шлях на його діагональ.",
      "capture": false,
      "explanation": "Ферзь з e4 стала на e1 та оголосила шах королю h4. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-queen-112",
      "motif": "Відкрита горизонталь",
      "white": "Kc3 Qa4 Pb4 Pd4 Be4",
      "black": "Pd5 Kd6 Pe6",
      "solution": "a4a6",
      "hint": "Король на d6. Знайди безпечний шлях на його горизонталь.",
      "capture": false,
      "explanation": "Ферзь з a4 стала на a6 та оголосила шах королю d6. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-queen-181",
      "motif": "Шах під захистом",
      "white": "Qc3 Ke3 Pd4 Pf4 Pe7",
      "black": "Ra4 Pd5 Pc6 Kd6",
      "solution": "c3c5",
      "hint": "Король на d6. Знайди безпечний шлях на його діагональ.",
      "capture": false,
      "explanation": "Ферзь з c3 стала на c5 та оголосила шах королю d6. Її прикриває своя фігура."
    }
  ],
  "knight": [
    {
      "id": "lesson-knight-100",
      "motif": "Стрибок крізь укриття",
      "white": "Kh2 Nd6",
      "black": "Pc3 Nb4 Kd4",
      "solution": "d6f5",
      "hint": "Король на d4. Знайди безпечний стрибок конем.",
      "capture": false,
      "explanation": "Кінь з d6 стала на f5 та оголосила шах королю d4. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-knight-105",
      "motif": "Стрибок крізь укриття",
      "white": "Bb2 Kh2 Pg3 Ne5",
      "black": "Kh8",
      "solution": "e5f7",
      "hint": "Король на h8. Знайди безпечний стрибок конем.",
      "capture": false,
      "explanation": "Кінь з e5 стала на f7 та оголосила шах королю h8. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-knight-106",
      "motif": "Стрибок крізь укриття",
      "white": "Kc3 Pb4 Nc5",
      "black": "Ph4 Kg5",
      "solution": "c5e6",
      "hint": "Король на g5. Знайди безпечний стрибок конем.",
      "capture": false,
      "explanation": "Кінь з c5 стала на e6 та оголосила шах королю g5. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-knight-110",
      "motif": "Стрибок крізь укриття",
      "white": "Kg1 Nh2 Rd4",
      "black": "Pf4 Kg5",
      "solution": "h2f3",
      "hint": "Король на g5. Знайди безпечний стрибок конем.",
      "capture": false,
      "explanation": "Кінь з h2 стала на f3 та оголосила шах королю g5. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-knight-115",
      "motif": "Стрибок крізь укриття",
      "white": "Ka1 Nf4",
      "black": "Pb3 Kb4 Pc4",
      "solution": "f4d5",
      "hint": "Король на b4. Знайди безпечний стрибок конем.",
      "capture": false,
      "explanation": "Кінь з f4 стала на d5 та оголосила шах королю b4. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-knight-1",
      "motif": "Стрибок крізь укриття",
      "white": "Ka1 Pb2 Nd4",
      "black": "Rh3 Pb4 Ka5",
      "solution": "d4c6",
      "hint": "Король на a5. Знайди безпечний стрибок конем.",
      "capture": false,
      "explanation": "Кінь з d4 стала на c6 та оголосила шах королю a5. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-knight-101",
      "motif": "Стрибок крізь укриття",
      "white": "Kb2 Pa3 Pe5 Ng5",
      "black": "Pd7 Kd8",
      "solution": "g5f7",
      "hint": "Король на d8. Знайди безпечний стрибок конем.",
      "capture": false,
      "explanation": "Кінь з g5 стала на f7 та оголосила шах королю d8. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-knight-108",
      "motif": "Стрибок крізь укриття",
      "white": "Kc1 Pb2 Nd6",
      "black": "Pa6 Ka7 Pb7",
      "solution": "d6c8",
      "hint": "Король на a7. Знайди безпечний стрибок конем.",
      "capture": false,
      "explanation": "Кінь з d6 стала на c8 та оголосила шах королю a7. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-knight-109",
      "motif": "Стрибок крізь укриття",
      "white": "Kd2 Pc3 Nb6",
      "black": "Be2 Pe5 Kd6",
      "solution": "b6c8",
      "hint": "Король на d6. Знайди безпечний стрибок конем.",
      "capture": false,
      "explanation": "Кінь з b6 стала на c8 та оголосила шах королю d6. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-knight-11",
      "motif": "Стрибок крізь укриття",
      "white": "Kc3 Nb4 Pd4",
      "black": "Pe3 Kf4 Be6",
      "solution": "b4d3",
      "hint": "Король на f4. Знайди безпечний стрибок конем.",
      "capture": false,
      "explanation": "Кінь з b4 стала на d3 та оголосила шах королю f4. Її прикриває своя фігура."
    },
    {
      "id": "lesson-knight-12",
      "motif": "Взяття конем з шахом",
      "white": "Kh2 Na3 Pg3",
      "black": "Pc3 Pe3 Kd4 Bb5",
      "solution": "a3b5",
      "hint": "Побий фігуру так, щоб одночасно напасти на короля d4.",
      "capture": true,
      "explanation": "Кінь з a3 стала на b5 із взяттям та оголосила шах королю d4. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-knight-10",
      "motif": "Стрибок крізь укриття",
      "white": "Ke1 Pd2 Pf2 Ne5 Bd6",
      "black": "Pe7 Kf8",
      "solution": "e5d7",
      "hint": "Король на f8. Знайди безпечний стрибок конем.",
      "capture": false,
      "explanation": "Кінь з e5 стала на d7 та оголосила шах королю f8. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-knight-102",
      "motif": "Стрибок крізь укриття",
      "white": "Kc3 Pd4 Nh6 Ra7",
      "black": "Pd5 Kd6 Pe6",
      "solution": "h6f7",
      "hint": "Король на d6. Знайди безпечний стрибок конем.",
      "capture": false,
      "explanation": "Кінь з h6 стала на f7 та оголосила шах королю d6. Її прикриває своя фігура."
    },
    {
      "id": "lesson-knight-111",
      "motif": "Стрибок крізь укриття",
      "white": "Kd2 Pc3 Nb4",
      "black": "Pe4 Ke5 Pf5 Ne6",
      "solution": "b4c6",
      "hint": "Король на e5. Знайди безпечний стрибок конем.",
      "capture": false,
      "explanation": "Кінь з b4 стала на c6 та оголосила шах королю e5. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-knight-103",
      "motif": "Стрибок крізь укриття",
      "white": "Kc3 Pb4 Pd4 Pf5 Nf6",
      "black": "Pc6 Pb7 Kc7",
      "solution": "f6e8",
      "hint": "Король на c7. Знайди безпечний стрибок конем.",
      "capture": false,
      "explanation": "Кінь з f6 стала на e8 та оголосила шах королю c7. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-knight-107",
      "motif": "Стрибок крізь укриття",
      "white": "Rc2 Ka3 Pb4 Nh6",
      "black": "Nc6 Pe6 Pd7 Ke7",
      "solution": "h6g8",
      "hint": "Король на e7. Знайди безпечний стрибок конем.",
      "capture": false,
      "explanation": "Кінь з h6 стала на g8 та оголосила шах королю e7. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-knight-117",
      "motif": "Стрибок крізь укриття",
      "white": "Kc3 Pb4 Pd4 Nh4",
      "black": "Bh2 Pf3 Kf4 Pg4",
      "solution": "h4g6",
      "hint": "Король на f4. Знайди безпечний стрибок конем.",
      "capture": false,
      "explanation": "Кінь з h4 стала на g6 та оголосила шах королю f4. Нападника не можна побити у відповідь."
    },
    {
      "id": "lesson-knight-104",
      "motif": "Стрибок крізь укриття",
      "white": "Ke3 Nb4 Pd4 Pf4 Pc5",
      "black": "Pc6 Kc7 Pd7 Rg7",
      "solution": "b4a6",
      "hint": "Король на c7. Знайди безпечний стрибок конем.",
      "capture": false,
      "explanation": "Кінь з b4 стала на a6 та оголосила шах королю c7. Нападника не можна побити у відповідь."
    }
  ],
  "pawn": [
    {
      "id": "lesson-pawn-14",
      "motif": "Просування захищеного пішака",
      "white": "Ka1 Pa2 Pb2",
      "black": "Pc3 Kb4",
      "solution": "a2a3",
      "hint": "Король на b4. Знайди безпечний хід пішака.",
      "capture": false,
      "explanation": "Пішак з a2 стала на a3 та оголосила шах королю b4. Її прикриває своя фігура."
    },
    {
      "id": "lesson-pawn-145",
      "motif": "Просування захищеного пішака",
      "white": "Kg1 Ph2 Ba5 Pb5",
      "black": "Ka7",
      "solution": "b5b6",
      "hint": "Король на a7. Знайди безпечний хід пішака.",
      "capture": false,
      "explanation": "Пішак з b5 стала на b6 та оголосила шах королю a7. Її прикриває своя фігура."
    },
    {
      "id": "lesson-pawn-148",
      "motif": "Просування захищеного пішака",
      "white": "Ke1 Pe2 Pf2",
      "black": "Pg3 Kf4",
      "solution": "e2e3",
      "hint": "Король на f4. Знайди безпечний хід пішака.",
      "capture": false,
      "explanation": "Пішак з e2 стала на e3 та оголосила шах королю f4. Її прикриває своя фігура."
    },
    {
      "id": "lesson-pawn-160",
      "motif": "Просування захищеного пішака",
      "white": "Ka3 Bc3 Pg6",
      "black": "Pe7 Kf8",
      "solution": "g6g7",
      "hint": "Король на f8. Знайди безпечний хід пішака.",
      "capture": false,
      "explanation": "Пішак з g6 стала на g7 та оголосила шах королю f8. Її прикриває своя фігура."
    },
    {
      "id": "lesson-pawn-201",
      "motif": "Просування захищеного пішака",
      "white": "Pb2 Kd2 Pc3",
      "black": "Ka5 Nh6",
      "solution": "b2b4",
      "hint": "Король на a5. Знайди безпечний хід пішака.",
      "capture": false,
      "explanation": "Пішак з b2 стала на b4 та оголосила шах королю a5. Її прикриває своя фігура."
    },
    {
      "id": "lesson-pawn-110",
      "motif": "Захищене взяття пішаком",
      "white": "Kb2 Pa3 Pc3 Pg6",
      "black": "Pb4 Ka5",
      "solution": "c3b4",
      "hint": "Побий фігуру так, щоб одночасно напасти на короля a5.",
      "capture": true,
      "explanation": "Пішак з c3 стала на b4 із взяттям та оголосила шах королю a5. Її прикриває своя фігура."
    },
    {
      "id": "lesson-pawn-113",
      "motif": "Захищене взяття пішаком",
      "white": "Pf2 Kc3 Pb4 Pd4",
      "black": "Pc5 Kd6",
      "solution": "d4c5",
      "hint": "Побий фігуру так, щоб одночасно напасти на короля d6.",
      "capture": true,
      "explanation": "Пішак з d4 стала на c5 із взяттям та оголосила шах королю d6. Її прикриває своя фігура."
    },
    {
      "id": "lesson-pawn-120",
      "motif": "Захищене взяття пішаком",
      "white": "Kg3 Pf4 Pa5 Bc5",
      "black": "Rb6 Ka7",
      "solution": "a5b6",
      "hint": "Побий фігуру так, щоб одночасно напасти на короля a7.",
      "capture": true,
      "explanation": "Пішак з a5 стала на b6 із взяттям та оголосила шах королю a7. Її прикриває своя фігура."
    },
    {
      "id": "lesson-pawn-122",
      "motif": "Захищене взяття пішаком",
      "white": "Kh2 Pd3 Rf3 Pg3",
      "black": "Pf4 Kg5",
      "solution": "g3f4",
      "hint": "Побий фігуру так, щоб одночасно напасти на короля g5.",
      "capture": true,
      "explanation": "Пішак з g3 стала на f4 із взяттям та оголосила шах королю g5. Її прикриває своя фігура."
    },
    {
      "id": "lesson-pawn-127",
      "motif": "Захищене взяття пішаком",
      "white": "Pa2 Kd2 Pe3 Rf3",
      "black": "Pf4 Ke5",
      "solution": "e3f4",
      "hint": "Побий фігуру так, щоб одночасно напасти на короля e5.",
      "capture": true,
      "explanation": "Пішак з e3 стала на f4 із взяттям та оголосила шах королю e5. Її прикриває своя фігура."
    },
    {
      "id": "lesson-pawn-1",
      "motif": "Просування захищеного пішака",
      "white": "Ke3 Pd4 Pe6 Rc7",
      "black": "Rf4 Pg7 Kf8",
      "solution": "e6e7",
      "hint": "Король на f8. Знайди безпечний хід пішака.",
      "capture": false,
      "explanation": "Пішак з e6 стала на e7 та оголосила шах королю f8. Її прикриває своя фігура."
    },
    {
      "id": "lesson-pawn-10",
      "motif": "Захищене взяття пішаком",
      "white": "Ke1 Pd2 Pf2 Pg6 Rf7",
      "black": "Pe3 Kd4",
      "solution": "f2e3",
      "hint": "Побий фігуру так, щоб одночасно напасти на короля d4.",
      "capture": true,
      "explanation": "Пішак з f2 стала на e3 із взяттям та оголосила шах королю d4. Її прикриває своя фігура."
    },
    {
      "id": "lesson-pawn-102",
      "motif": "Захищене взяття пішаком",
      "white": "Kb2 Pa3 Pc3 Pf3 Bh4",
      "black": "Pb4 Ka5",
      "solution": "c3b4",
      "hint": "Побий фігуру так, щоб одночасно напасти на короля a5.",
      "capture": true,
      "explanation": "Пішак з c3 стала на b4 із взяттям та оголосила шах королю a5. Її прикриває своя фігура."
    },
    {
      "id": "lesson-pawn-141",
      "motif": "Просування захищеного пішака",
      "white": "Kc1 Pd2 Pe2 Be3",
      "black": "Pf4 Nc5 Ke5",
      "solution": "d2d4",
      "hint": "Король на e5. Знайди безпечний хід пішака.",
      "capture": false,
      "explanation": "Пішак з d2 стала на d4 та оголосила шах королю e5. Її прикриває своя фігура."
    },
    {
      "id": "lesson-pawn-100",
      "motif": "Захищене взяття пішаком",
      "white": "Bb3 Kc3 Pb4 Pd4 Pa6",
      "black": "Pc5 Pe5 Kd6",
      "solution": "d4c5",
      "hint": "Побий фігуру так, щоб одночасно напасти на короля d6.",
      "capture": true,
      "explanation": "Пішак з d4 стала на c5 із взяттям та оголосила шах королю d6. Її прикриває своя фігура."
    },
    {
      "id": "lesson-pawn-11",
      "motif": "Просування захищеного пішака",
      "white": "Kc1 Pb2 Pd2 Pa3 Rh6",
      "black": "Pd4 Kc5 Bf7",
      "solution": "b2b4",
      "hint": "Король на c5. Знайди безпечний хід пішака.",
      "capture": false,
      "explanation": "Пішак з b2 стала на b4 та оголосила шах королю c5. Її прикриває своя фігура."
    },
    {
      "id": "lesson-pawn-101",
      "motif": "Захищене взяття пішаком",
      "white": "Kb2 Pa3 Pc3 Rd3 Ph6",
      "black": "Pd4 Pf4 Ke5",
      "solution": "c3d4",
      "hint": "Побий фігуру так, щоб одночасно напасти на короля e5.",
      "capture": true,
      "explanation": "Пішак з c3 стала на d4 із взяттям та оголосила шах королю e5. Її прикриває своя фігура."
    },
    {
      "id": "lesson-pawn-619",
      "motif": "Просування захищеного пішака",
      "white": "Pd2 Kg3 Pe4 Pf4 Ph4",
      "black": "Pd5 Na6 Pc6 Kd6",
      "solution": "e4e5",
      "hint": "Король на d6. Знайди безпечний хід пішака.",
      "capture": false,
      "explanation": "Пішак з e4 стала на e5 та оголосила шах королю d6. Її прикриває своя фігура."
    }
  ]
};
