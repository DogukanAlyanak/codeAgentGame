function rand(max, min = 0) {
    let ran
    do {
        ran = Math.random() * (max - min) + min;
    } while (min > ran || max < ran);
    return ran;
 }