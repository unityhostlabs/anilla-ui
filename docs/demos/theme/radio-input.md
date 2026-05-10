---
layout: false
---

<link rel="stylesheet" href="/demos.css">

<div class="flex items-center justify-center gap-6 w-full max-w-lg mx-auto">
    <label class="form-label">
        <input class="form-radio" type="radio" name="themeRadio" value="light" theme-trigger>
        Light
    </label>
    <label class="form-label">
        <input class="form-radio" type="radio" name="themeRadio" value="dark" theme-trigger>
        Dark
    </label>
    <label class="form-label">
        <input class="form-radio" type="radio" name="themeRadio" value="auto" theme-trigger>
        Auto
    </label>
</div>

<script type="module">
    import { Theme } from '../../../src/index.js';

    const theme = new Theme('html', {
        trigger: '[theme-trigger]'
    });
</script>