const colors = [
    '#4a0206', '#710006', '#bb0d1a', '#fa6632', '#cf0638', '#ef3e4d', '#fdbbc1'
];

const TWO_PI = Math.PI * 2;

function lerp(value, min, max) {
    return min + value * (max - min);
}

function map(value, inMin, inMax, outMin, outMax) {
    return lerp(normalize(value, inMin, inMax), outMin, outMax);
}

function normalize(value, min, max) {
    return (value - min) / (max - min);
}

function fill(size, fn) {
    return [...Array(size)].map((undef, i) => fn(i));
}

function random(min, max) {

    if (arguments.length == 0) {
        return Math.random();
    }

    if (Array.isArray(min)) {
        return min[Math.floor(Math.random() * min.length)];
    }

    if (typeof min == 'undefined') min = 1;
    if (typeof max == 'undefined') max = min || 1, min = 0;

    return min + Math.random() * (max - min);
}

function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

function toRGB(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
}

class Light {

    constructor({
        position = { x: 0, y: 0 },
        radius,
        color = '#FFFFFF',
        alpha = 0.5,
        softness = 0.1,
        twinkle = false
    } = {}) {

        this.graphics = document.createElement('canvas').getContext('2d');
        this.position = position;
        this.radius = radius;
        this.color = color;
        this.alpha = alpha;
        this.softness = softness;

        this.twinkle = random() > 0.7 ? false : {
            phase: random(TWO_PI),
            speed: random(0.002, 0.004)
        };

        this.render();
    }

    get canvas() {
        return this.graphics.canvas;
    }

    render() {

        const { graphics, radius, color, alpha, softness } = this;
        const [r, g, b] = toRGB(color);
        const gradient = graphics.createRadialGradient(0, 0, radius, 0, 0, 0);

        gradient.addColorStop(0, `rgba(${r},${g},${b},0)`);
        gradient.addColorStop(softness, `rgba(${r},${g},${b},${alpha})`);
        gradient.addColorStop(1, `rgba(${r},${g},${b},${alpha})`);

        this.canvas.width = radius * 2.1
        this.canvas.height = radius * 2.1;

        graphics.translate(radius, radius);
        graphics.beginPath();
        graphics.arc(0, 0, radius, 0, TWO_PI);
        graphics.fillStyle = gradient;
        graphics.fill();
    }

    update(time) {

        if (!this.twinkle) return;

        const { phase, speed } = this.twinkle;
        const theta = phase + time * speed;
        const value = normalize(Math.sin(theta), -1, 1);

        this.twinkle.scale = lerp(value, 0.98, 1.02);
        this.twinkle.alpha = lerp(value, 0.1, 1);
    }

    draw(context) {

        context.save();
        context.translate(this.position.x, this.position.y);

        if (this.twinkle) {
            const { scale, alpha } = this.twinkle;
            context.scale(scale, scale);
            context.globalAlpha = alpha;
        }

        context.drawImage(this.canvas, -this.radius, -this.radius);
        context.restore();
    }
}

class Background {

    constructor({ baseColor = '#0C0000' } = {}) {
        this.baseColor = baseColor;
        this.graphics = document.createElement('canvas').getContext('2d');
        this.render();
    }

    get canvas() {
        return this.graphics.canvas;
    }

    render() {

        const width = window.innerWidth;
        const height = window.innerHeight;
        const centerY = height / 2;
        const count = Math.floor(0.05 * width);
        const context = this.graphics;

        context.canvas.width = width;
        context.canvas.height = height;
        context.globalCompositeOperation = 'lighter';
        context.beginPath();
        context.fillStyle = this.baseColor;
        context.fillRect(0, 0, width, height);

        for (let i = 0; i < count; i++) {

            const light = new Light({
                radius: random(200, 400),
                alpha: random(0.01, 0.05),
                color: random(colors),
                softness: random(0.25, 0.9)
            });

            context.drawImage(
                light.canvas,
                random(width) - light.radius,
                centerY - light.radius + random(-200, 200)
            );
        }
    }

    draw(context) {
        context.drawImage(this.canvas, 0, 0);
    }
}

const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
document.body.appendChild(canvas);

const background = new Background();

let lights = [];

function draw(time) {

    const { width, height } = canvas;

    context.save();
    context.clearRect(0, 0, width, height);
    context.globalCompositeOperation = 'lighter';

    background.draw(context);

    lights.forEach(light => {
        light.update(time);
        light.draw(context);
    });

    context.restore();
    requestAnimationFrame(draw);
}

function resize(event) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

function reset() {

    const { width, height } = canvas;
    const count = Math.floor(width * 0.1);
    const theta = random(TWO_PI);
    const amplitude = height * 0.08;
    const cx = width / 2;
    const cy = height / 2;

    lights = fill(count, i => {

        const percent = (i / count);
        const x = percent * width;
        const distanceToCenter = 1 - Math.abs(cx - x) / cx;
        const varianceRange = lerp(distanceToCenter, 50, 200);
        const variance = random(-varianceRange, varianceRange);
        const offset = Math.sin(theta + percent * TWO_PI) * amplitude + variance;
        const y = cy + offset;

        return new Light({
            position: { x, y },
            radius: random(25, Math.max(1, 80 * distanceToCenter)),
            color: random(colors),
            alpha: random(0.05, 0.6),
            softness: random(0.02, 0.5)
        });
    });
}

function init() {
    resize();
    reset();
    requestAnimationFrame(draw);
}

init();

/* cal */

$(document).ready(function() {

    var words = ['<iframe width="300" height="220" src="https://www.youtube.com/embed/Nt_PIbNmEJc" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe> ',
'<iframe width="300" height="220"  src="https://www.youtube.com/embed/9gKTHuJnVrU" title="YouTube video player" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
'<iframe width="300" height="220"  src="https://www.youtube.com/embed/CyLaBbFextI" title="YouTube video player" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
'<iframe width="300" height="220"  src="https://www.youtube.com/embed/2LkUu85JLAc" title="YouTube video player" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
'<iframe width="300" height="220" src="https://www.youtube.com/embed/p47eLJ-KEXM" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
'<iframe width="300" height="220" src="https://www.youtube.com/embed/vHByYDHGEdk" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
'<iframe width="300" height="220" src="https://www.youtube.com/embed/NfYCG0PjiF4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
'<iframe width="300" height="220" src="https://www.youtube.com/embed/_Z2GRIUpCf0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
'<iframe width="300" height="220" src="https://www.youtube.com/embed/hcb9zGcpMHg" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
'<iframe width="300" height="220" src="https://www.youtube.com/embed/NpLnPlI0FnU" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
'<iframe width="300" height="220" src="https://www.youtube.com/embed/B5Deno4mqpA" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
'<iframe width="300" height="220" src="https://www.youtube.com/embed/P6o5pVOKd8k" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
'<iframe width="300" height="220" src="https://www.youtube.com/embed/bE9WR_kc-1E" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
'<iframe width="300" height="220" src="https://www.youtube.com/embed/WE74Kkvoals" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
'<iframe width="300" height="220" src="https://www.youtube.com/embed/j0188BIijDU" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
'<iframe width="300" height="220" src="https://www.youtube.com/embed/osAgKn3iSLc" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
'<iframe width="300" height="220" src="https://www.youtube.com/embed/WsiLDjsSBrQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
'<iframe width="300" height="220" src="https://www.youtube.com/embed/KCkvrkDDnos" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
'<iframe width="300" height="220" src="https://www.youtube.com/embed/6hdsdMmrh9Y" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
'<iframe width="300" height="220" src="https://www.youtube.com/embed/zjXtEWdTlTE" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
'<iframe width="300" height="220" src="https://www.youtube.com/embed/BvK7ORGSsHI" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
'<iframe width="300" height="220" src="https://www.youtube.com/embed/wc7fuZKaKiI" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
'<iframe width="300" height="220" src="https://www.youtube.com/embed/CYSEt2Hq89Y" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
'<iframe width="300" height="220" src="https://www.youtube.com/embed/EEWPzfZ1hOg" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',
'<iframe width="300" height="220" src="https://www.youtube.com/embed/ZRae0QGJ1VU" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>',



];

    var message = "";
    var date = new Date();
    var day = date.getDate();
    var month = date.getMonth() + 1;
    var scrolled = false;
    var timeDelay = 200;

    // function to reveal message
    var cardReveal = function() {
        $("#message").text(message).show();
    }

    //day=25; // uncomment to skip to 25

    // Only work in December
    if (month === 12) {
        // Loop through each calendar window
        $("li").each(function(index) {
            var adventwindow = index + 1;
            var item = $(this);

            // Open past windows
            if (day !== adventwindow && adventwindow < day) {
                window.setTimeout(function() {
                    item.children(".door").addClass("open");
                }, timeDelay);
            }

            // timeout offset for past window opening animation
            timeDelay += 100;

            // Add words so far to message variable
            if (adventwindow <= day) {
                var word = words[index];
                $(this).append('<div class="revealed">' + word + '</div>');
                message = message + " " + word;
            }

            // Add jiggle animation to current day window
            if (adventwindow === day) {
                $(this).addClass("current");
                $(this).addClass("jiggle");
            }

            // On clicking a window, toggle it open/closed and
            // handle other things such as removing jiggle and 25th
            $(this).on("click", function() {
                if (adventwindow <= day) {
                    $(this).children(".door").toggleClass("open");
                }

                $(this).removeClass("jiggle");

                // If 25th, can show the message
                if (day >= 25 && adventwindow === 25) {
                    messageReveal();

                    // Animate scroll to message if not already done
                    if (!scrolled) {
                        $('html, body').animate({
                            scrollTop: $("#message").offset().top
                        }, 2000);
                        scrolled = true;
                    }
                }
            });

        });

        // If beyond 24, show message
        if (day >= 26) {
            messageReveal();
        }

    }

});
