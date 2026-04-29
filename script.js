// ===== PIXELATED DNA HELIX ANIMATION =====
class DNAHelix {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.time = 0;
        this.pixelSize = options.pixelSize || 4;
        this.speed = options.speed || 0.02;
        this.radius = options.radius || 80;
        this.verticalSpacing = options.verticalSpacing || 12;
        this.numPoints = options.numPoints || 40;
        this.colorA = options.colorA || { r: 230, g: 126, b: 34 };
        this.colorB = options.colorB || { r: 0, g: 153, b: 153 };
        this.isDark = options.isDark || false;
        this.grainIntensity = options.grainIntensity || 0.15;
        this.particles = [];
        this.initParticles();
        this.animate();
    }

    initParticles() {
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1,
                alpha: Math.random() * 0.3
            });
        }
    }

    drawPixel(x, y, size, color, alpha) {
        this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
        // Snap to grid for pixelated look
        const sx = Math.round(x / size) * size;
        const sy = Math.round(y / size) * size;
        this.ctx.fillRect(sx, sy, size, size);
    }

    drawGrain() {
        const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 16) {
            const noise = (Math.random() - 0.5) * this.grainIntensity * 255;
            data[i] = Math.min(255, Math.max(0, data[i] + noise));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
        }
        this.ctx.putImageData(imageData, 0, 0);
    }

    drawParticles() {
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > this.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.height) p.vy *= -1;
            const color = this.isDark ? '255,255,255' : '230,126,34';
            this.ctx.fillStyle = `rgba(${color}, ${p.alpha})`;
            this.ctx.fillRect(
                Math.round(p.x / 2) * 2,
                Math.round(p.y / 2) * 2,
                p.size, p.size
            );
        });
    }

    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const startY = centerY - (this.numPoints * this.verticalSpacing) / 2;

        // Draw connecting rungs first (behind strands)
        for (let i = 0; i < this.numPoints; i++) {
            const y = startY + i * this.verticalSpacing;
            const angle = (i * 0.3) + this.time;
            const x1 = centerX + Math.cos(angle) * this.radius;
            const x2 = centerX + Math.cos(angle + Math.PI) * this.radius;
            const depth1 = Math.sin(angle);
            const depth2 = Math.sin(angle + Math.PI);

            // Draw rung pixels between the two strands
            const steps = Math.abs(x2 - x1) / (this.pixelSize * 2);
            for (let s = 0; s <= steps; s++) {
                const t = s / steps;
                const rx = x1 + (x2 - x1) * t;
                const ry = y;
                const depthT = depth1 + (depth2 - depth1) * t;
                const alpha = 0.05 + Math.abs(depthT) * 0.1;
                const mixColor = {
                    r: Math.round(this.colorA.r * (1 - t) + this.colorB.r * t),
                    g: Math.round(this.colorA.g * (1 - t) + this.colorB.g * t),
                    b: Math.round(this.colorA.b * (1 - t) + this.colorB.b * t)
                };
                this.drawPixel(rx, ry, this.pixelSize, mixColor, alpha);
            }
        }

        // Store points with depth for sorting
        const allPoints = [];
        for (let i = 0; i < this.numPoints; i++) {
            const y = startY + i * this.verticalSpacing;
            const angle = (i * 0.3) + this.time;
            // Strand A
            allPoints.push({
                x: centerX + Math.cos(angle) * this.radius,
                y: y,
                depth: Math.sin(angle),
                color: this.colorA,
                strand: 'A'
            });
            // Strand B
            allPoints.push({
                x: centerX + Math.cos(angle + Math.PI) * this.radius,
                y: y,
                depth: Math.sin(angle + Math.PI),
                color: this.colorB,
                strand: 'B'
            });
        }

        // Sort by depth (back to front)
        allPoints.sort((a, b) => a.depth - b.depth);

        // Draw all strand points
        allPoints.forEach(p => {
            const scale = 0.5 + (p.depth + 1) * 0.35;
            const alpha = 0.3 + (p.depth + 1) * 0.35;
            const size = this.pixelSize * scale;

            // Main pixel
            this.drawPixel(p.x, p.y, size, p.color, alpha);

            // Glow pixels around main
            const glowSize = size * 0.6;
            const glowAlpha = alpha * 0.3;
            this.drawPixel(p.x - size, p.y, glowSize, p.color, glowAlpha);
            this.drawPixel(p.x + size, p.y, glowSize, p.color, glowAlpha);
            this.drawPixel(p.x, p.y - size, glowSize, p.color, glowAlpha);
            this.drawPixel(p.x, p.y + size, glowSize, p.color, glowAlpha);

            // Extra detail pixels for larger points
            if (scale > 0.7) {
                this.drawPixel(p.x - size * 2, p.y, glowSize * 0.5, p.color, glowAlpha * 0.4);
                this.drawPixel(p.x + size * 2, p.y, glowSize * 0.5, p.color, glowAlpha * 0.4);
            }
        });

        // Draw ambient particles
        this.drawParticles();

        // Apply grain effect
        this.drawGrain();

        this.time += this.speed;
        requestAnimationFrame(() => this.animate());
    }
}

// ===== BRAIN PIXEL ANIMATION =====
class BrainPixel {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.time = 0;
        this.animate();
    }

    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        const cx = this.width / 2;
        const cy = this.height / 2;
        const pixelSize = 4;

        // Draw a brain-like shape using pixel dots
        for (let angle = 0; angle < Math.PI * 2; angle += 0.05) {
            // Brain outline shape
            const r = 80 + Math.sin(angle * 3 + this.time) * 15 + Math.cos(angle * 5) * 10;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r * 0.85;
            const alpha = 0.4 + Math.sin(angle + this.time) * 0.3;
            this.ctx.fillStyle = `rgba(0, 153, 153, ${alpha})`;
            const sx = Math.round(x / pixelSize) * pixelSize;
            const sy = Math.round(y / pixelSize) * pixelSize;
            this.ctx.fillRect(sx, sy, pixelSize, pixelSize);
        }

        // Inner detail lines
        for (let i = 0; i < 8; i++) {
            const startAngle = (i / 8) * Math.PI * 2;
            for (let t = 0; t < 1; t += 0.02) {
                const angle = startAngle + t * 0.8;
                const r = t * 70 + Math.sin(t * 6 + this.time + i) * 10;
                const x = cx + Math.cos(angle) * r;
                const y = cy + Math.sin(angle) * r * 0.85;
                const alpha = 0.15 + Math.sin(t * 4 + this.time) * 0.1;
                this.ctx.fillStyle = `rgba(230, 126, 34, ${alpha})`;
                const sx = Math.round(x / pixelSize) * pixelSize;
                const sy = Math.round(y / pixelSize) * pixelSize;
                this.ctx.fillRect(sx, sy, pixelSize, pixelSize);
            }
        }

        // Pulse ring
        const pulseR = 90 + Math.sin(this.time * 2) * 20;
        for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
            const x = cx + Math.cos(angle) * pulseR;
            const y = cy + Math.sin(angle) * pulseR * 0.85;
            const alpha = 0.1 + Math.sin(this.time * 2) * 0.05;
            this.ctx.fillStyle = `rgba(230, 126, 34, ${alpha})`;
            const sx = Math.round(x / pixelSize) * pixelSize;
            const sy = Math.round(y / pixelSize) * pixelSize;
            this.ctx.fillRect(sx, sy, pixelSize - 1, pixelSize - 1);
        }

        this.time += 0.015;
        requestAnimationFrame(() => this.animate());
    }
}

// ===== INIT ON DOM READY =====
document.addEventListener('DOMContentLoaded', () => {

    // Initialize DNA animations
    new DNAHelix('dna-canvas', {
        pixelSize: 5,
        speed: 0.02,
        radius: 90,
        verticalSpacing: 14,
        numPoints: 38,
        grainIntensity: 0.12
    });

    new DNAHelix('dna-canvas-2', {
        pixelSize: 4,
        speed: 0.025,
        radius: 80,
        verticalSpacing: 13,
        numPoints: 36,
        isDark: true,
        grainIntensity: 0.18,
        colorA: { r: 230, g: 126, b: 34 },
        colorB: { r: 0, g: 200, b: 200 }
    });

    // Initialize Brain animation
    new BrainPixel('brain-canvas');

    // ===== SCROLL ANIMATIONS =====
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

    // ===== COUNTER ANIMATION =====
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.target);
                animateCounter(el, target);
                counterObserver.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.counter').forEach(el => counterObserver.observe(el));

    function animateCounter(el, target) {
        let current = 0;
        const duration = 2000;
        const stepTime = 16;
        const steps = duration / stepTime;
        const increment = target / steps;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            el.textContent = Math.round(current).toLocaleString();
        }, stepTime);
    }

    // ===== TAB SWITCHING =====
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const tabId = btn.dataset.tab;
            document.getElementById(tabId).classList.add('active');
        });
    });

    // ===== NAVBAR SCROLL EFFECT =====
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        const currentScroll = window.scrollY;

        if (currentScroll > 100) {
            navbar.classList.add('shadow-lg');
            navbar.style.background = 'rgba(255,255,255,0.95)';
        } else {
            navbar.classList.remove('shadow-lg');
            navbar.style.background = 'rgba(255,255,255,0.8)';
        }
        lastScroll = currentScroll;
    });

    // ===== FLOATING PARTICLES =====
    const particlesContainer = document.getElementById('hero-particles');
    if (particlesContainer) {
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDuration = (Math.random() * 15 + 10) + 's';
            particle.style.animationDelay = Math.random() * 10 + 's';
            particle.style.width = (Math.random() * 4 + 2) + 'px';
            particle.style.height = particle.style.width;
            particlesContainer.appendChild(particle);
        }
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    const mobileBtn = document.getElementById('mobile-menu-btn');
    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            const nav = document.querySelector('nav .hidden.md\\:flex');
            if (nav) nav.classList.toggle('hidden');
        });
    }
});
