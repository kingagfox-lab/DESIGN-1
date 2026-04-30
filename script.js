class DNAHelix {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.time = 0;
        this.speed = options.speed || 0.012;
        this.radius = options.radius || 90;
        this.numPoints = options.numPoints || 80;
        this.isDark = options.isDark || false;
        this.grainIntensity = options.grainIntensity || 0.08;
        this.strandWidth = options.strandWidth || 8;
        this.colorA = options.colorA || { r: 200, g: 30, b: 40 };
        this.colorB = options.colorB || { r: 30, g: 80, b: 200 };
        this.particles = [];
        this.initParticles();
        this.animate();
    }

    initParticles() {
        for (let i = 0; i < 80; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                size: Math.random() * 2 + 0.5,
                alpha: Math.random() * 0.15,
                pulse: Math.random() * Math.PI * 2
            });
        }
    }

    lerpColor(c1, c2, t) {
        return {
            r: Math.round(c1.r + (c2.r - c1.r) * t),
            g: Math.round(c1.g + (c2.g - c1.g) * t),
            b: Math.round(c1.b + (c2.b - c1.b) * t)
        };
    }

    drawStrandSegment(x, y, depth, color, width) {
        const brightness = 0.3 + (depth + 1) * 0.35;
        const lit = {
            r: Math.min(255, Math.round(color.r * brightness + (depth + 1) * 40)),
            g: Math.min(255, Math.round(color.g * brightness + (depth + 1) * 30)),
            b: Math.min(255, Math.round(color.b * brightness + (depth + 1) * 40))
        };
        const size = width * (0.6 + (depth + 1) * 0.25);
        const grad = this.ctx.createRadialGradient(x, y, 0, x, y, size * 1.5);
        grad.addColorStop(0, `rgba(${Math.min(255, lit.r + 80)}, ${Math.min(255, lit.g + 60)}, ${Math.min(255, lit.b + 80)}, ${0.9 * brightness})`);
        grad.addColorStop(0.4, `rgba(${lit.r}, ${lit.g}, ${lit.b}, ${0.85 * brightness})`);
        grad.addColorStop(0.7, `rgba(${Math.round(lit.r * 0.5)}, ${Math.round(lit.g * 0.4)}, ${Math.round(lit.b * 0.5)}, ${0.5 * brightness})`);
        grad.addColorStop(1, `rgba(${Math.round(lit.r * 0.2)}, ${Math.round(lit.g * 0.15)}, ${Math.round(lit.b * 0.2)}, 0)`);
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 1.5, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawBasePair(x1, y1, x2, y2, depth1, depth2) {
        const avgDepth = (depth1 + depth2) / 2;
        const brightness = 0.2 + (avgDepth + 1) * 0.3;
        const alpha = 0.15 + brightness * 0.35;
        const width = 1.5 + (avgDepth + 1) * 1;
        const grad = this.ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, `rgba(${this.colorA.r}, ${this.colorA.g}, ${this.colorA.b}, ${alpha})`);
        grad.addColorStop(0.35, `rgba(180, 180, 200, ${alpha * 0.5})`);
        grad.addColorStop(0.5, `rgba(220, 220, 240, ${alpha * 0.7})`);
        grad.addColorStop(0.65, `rgba(180, 180, 200, ${alpha * 0.5})`);
        grad.addColorStop(1, `rgba(${this.colorB.r}, ${this.colorB.g}, ${this.colorB.b}, ${alpha})`);
        this.ctx.strokeStyle = grad;
        this.ctx.lineWidth = width;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        if (avgDepth > 0) {
            const nodeGrad = this.ctx.createRadialGradient(midX, midY, 0, midX, midY, 3);
            nodeGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.6})`);
            nodeGrad.addColorStop(1, `rgba(200, 200, 220, 0)`);
            this.ctx.fillStyle = nodeGrad;
            this.ctx.beginPath();
            this.ctx.arc(midX, midY, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawStrandCurve(points, color) {
        if (points.length < 2) return;
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const depth = (p1.depth + p2.depth) / 2;
            const brightness = 0.3 + (depth + 1) * 0.35;
            const size = this.strandWidth * (0.5 + (depth + 1) * 0.3);
            const lit = {
                r: Math.min(255, Math.round(color.r * brightness + (depth + 1) * 50)),
                g: Math.min(255, Math.round(color.g * brightness + (depth + 1) * 40)),
                b: Math.min(255, Math.round(color.b * brightness + (depth + 1) * 50))
            };
            const grad = this.ctx.createLinearGradient(
                p1.x - size, p1.y, p1.x + size, p1.y
            );
            grad.addColorStop(0, `rgba(${Math.round(lit.r * 0.3)}, ${Math.round(lit.g * 0.2)}, ${Math.round(lit.b * 0.3)}, ${0.3 * brightness})`);
            grad.addColorStop(0.3, `rgba(${lit.r}, ${lit.g}, ${lit.b}, ${0.8 * brightness})`);
            grad.addColorStop(0.5, `rgba(${Math.min(255, lit.r + 60)}, ${Math.min(255, lit.g + 50)}, ${Math.min(255, lit.b + 60)}, ${0.95 * brightness})`);
            grad.addColorStop(0.7, `rgba(${lit.r}, ${lit.g}, ${lit.b}, ${0.8 * brightness})`);
            grad.addColorStop(1, `rgba(${Math.round(lit.r * 0.3)}, ${Math.round(lit.g * 0.2)}, ${Math.round(lit.b * 0.3)}, ${0.3 * brightness})`);
            this.ctx.strokeStyle = grad;
            this.ctx.lineWidth = size;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            if (i < points.length - 2) {
                const p3 = points[i + 2];
                const cpx = p2.x;
                const cpy = p2.y;
                this.ctx.quadraticCurveTo(cpx, cpy, (p2.x + p3.x) / 2, (p2.y + p3.y) / 2);
            } else {
                this.ctx.lineTo(p2.x, p2.y);
            }
            this.ctx.stroke();
        }
    }

    drawGlow(x, y, depth, color, size) {
        const brightness = (depth + 1) * 0.5;
        const glowGrad = this.ctx.createRadialGradient(x, y, 0, x, y, size);
        glowGrad.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.15 * brightness})`);
        glowGrad.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
        this.ctx.fillStyle = glowGrad;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawParticles() {
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.pulse += 0.02;
            if (p.x < 0 || p.x > this.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.height) p.vy *= -1;
            const flicker = p.alpha * (0.5 + Math.sin(p.pulse) * 0.5);
            const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
            grad.addColorStop(0, `rgba(150, 180, 255, ${flicker})`);
            grad.addColorStop(1, `rgba(100, 140, 220, 0)`);
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawGrain() {
        const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 8) {
            const noise = (Math.random() - 0.5) * this.grainIntensity * 255;
            data[i] = Math.min(255, Math.max(0, data[i] + noise));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
        }
        this.ctx.putImageData(imageData, 0, 0);
    }

    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        const cx = this.width / 2;
        const cy = this.height / 2;
        const totalHeight = this.height * 0.85;
        const spacing = totalHeight / this.numPoints;
        const startY = cy - totalHeight / 2;

        const strandA = [];
        const strandB = [];
        const pairs = [];

        for (let i = 0; i < this.numPoints; i++) {
            const y = startY + i * spacing;
            const angle = (i * 0.22) + this.time;
            const xA = cx + Math.cos(angle) * this.radius;
            const xB = cx + Math.cos(angle + Math.PI) * this.radius;
            const depthA = Math.sin(angle);
            const depthB = Math.sin(angle + Math.PI);
            strandA.push({ x: xA, y, depth: depthA });
            strandB.push({ x: xB, y, depth: depthB });
            pairs.push({ a: { x: xA, y, depth: depthA }, b: { x: xB, y, depth: depthB } });
        }

        for (let i = 0; i < this.numPoints; i += 3) {
            this.drawGlow(strandA[i].x, strandA[i].y, strandA[i].depth, this.colorA, 30);
            this.drawGlow(strandB[i].x, strandB[i].y, strandB[i].depth, this.colorB, 30);
        }

        const drawables = [];

        for (let i = 0; i < pairs.length; i += 2) {
            const p = pairs[i];
            const avgDepth = (p.a.depth + p.b.depth) / 2;
            drawables.push({ type: 'pair', data: p, depth: avgDepth });
        }

        for (let i = 0; i < strandA.length - 1; i++) {
            const avgDepthA = (strandA[i].depth + strandA[i + 1].depth) / 2;
            const avgDepthB = (strandB[i].depth + strandB[i + 1].depth) / 2;
            drawables.push({ type: 'strandA', index: i, depth: avgDepthA });
            drawables.push({ type: 'strandB', index: i, depth: avgDepthB });
        }

        for (let i = 0; i < strandA.length; i++) {
            drawables.push({ type: 'nodeA', index: i, depth: strandA[i].depth });
            drawables.push({ type: 'nodeB', index: i, depth: strandB[i].depth });
        }

        drawables.sort((a, b) => a.depth - b.depth);

        drawables.forEach(d => {
            if (d.type === 'pair') {
                this.drawBasePair(d.data.a.x, d.data.a.y, d.data.b.x, d.data.b.y, d.data.a.depth, d.data.b.depth);
            } else if (d.type === 'strandA') {
                const i = d.index;
                const p1 = strandA[i], p2 = strandA[i + 1];
                this.drawStrandCurve([p1, p2], this.colorA);
            } else if (d.type === 'strandB') {
                const i = d.index;
                const p1 = strandB[i], p2 = strandB[i + 1];
                this.drawStrandCurve([p1, p2], this.colorB);
            } else if (d.type === 'nodeA') {
                const p = strandA[d.index];
                this.drawStrandSegment(p.x, p.y, p.depth, this.colorA, this.strandWidth * 0.7);
            } else if (d.type === 'nodeB') {
                const p = strandB[d.index];
                this.drawStrandSegment(p.x, p.y, p.depth, this.colorB, this.strandWidth * 0.7);
            }
        });

        this.drawParticles();
        this.drawGrain();

        this.time += this.speed;
        requestAnimationFrame(() => this.animate());
    }
}

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

        for (let angle = 0; angle < Math.PI * 2; angle += 0.05) {

            const r = 80 + Math.sin(angle * 3 + this.time) * 15 + Math.cos(angle * 5) * 10;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r * 0.85;
            const alpha = 0.4 + Math.sin(angle + this.time) * 0.3;
            this.ctx.fillStyle = `rgba(0, 153, 153, ${alpha})`;
            const sx = Math.round(x / pixelSize) * pixelSize;
            const sy = Math.round(y / pixelSize) * pixelSize;
            this.ctx.fillRect(sx, sy, pixelSize, pixelSize);
        }

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

document.addEventListener('DOMContentLoaded', () => {

    new DNAHelix('dna-canvas', {
        speed: 0.012,
        radius: 95,
        numPoints: 70,
        strandWidth: 9,
        grainIntensity: 0.06,
        colorA: { r: 200, g: 30, b: 40 },
        colorB: { r: 30, g: 80, b: 220 }
    });

    new DNAHelix('dna-canvas-2', {
        speed: 0.015,
        radius: 85,
        numPoints: 65,
        strandWidth: 8,
        isDark: true,
        grainIntensity: 0.08,
        colorA: { r: 180, g: 20, b: 50 },
        colorB: { r: 20, g: 100, b: 240 }
    });

    new BrainPixel('brain-canvas');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

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

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const tabId = btn.dataset.tab;
            document.getElementById(tabId).classList.add('active');
        });
    });

    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        const currentScroll = window.scrollY;

        if (currentScroll > 100) {
            navbar.classList.add('shadow-lg');
            navbar.style.background = 'rgba(10,10,10,0.95)';
        } else {
            navbar.classList.remove('shadow-lg');
            navbar.style.background = 'rgba(10,10,10,1)';
        }
        lastScroll = currentScroll;
    });

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
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileBtn && mobileMenu) {
        let menuOpen = false;
        const spans = mobileBtn.querySelectorAll('span');

        function toggleMenu() {
            menuOpen = !menuOpen;
            if (menuOpen) {
                mobileMenu.classList.remove('hidden');
                mobileMenu.style.maxHeight = mobileMenu.scrollHeight + 'px';
                mobileMenu.style.opacity = '1';
                spans[0].style.transform = 'rotate(45deg) translate(4px, 4px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(3px, -3px)';
                spans[2].style.width = '1.5rem';
            } else {
                mobileMenu.style.maxHeight = '0px';
                mobileMenu.style.opacity = '0';
                setTimeout(() => mobileMenu.classList.add('hidden'), 300);
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
                spans[2].style.width = '1rem';
            }
        }

        mobileBtn.addEventListener('click', toggleMenu);

        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (menuOpen) toggleMenu();
            });
        });
    }

    const translations = {
        en: {
            nav_products: "Products",
            nav_clinical: "Clinical",
            nav_about: "About",
            nav_tell: "Tell us more",
            nav_request: "Request Consultation",
            hero_badge: "Trusted Worldwide",
            hero_title_1: "We Pioneer",
            hero_title_2: "Breakthroughs",
            hero_title_3: "in Healthcare",
            hero_desc: "At Siemens Healthineers, we enable healthcare providers worldwide to deliver high-quality, efficient patient care through advanced medical technology.",
            hero_btn_request: "Request Consultation",
            hero_btn_explore: "Explore Products",
            stat_1: "Countries Served",
            stat_2: "Systems Installed",
            stat_3: "R&D Engineers",
            testimonial: "\"Behind every one of these <strong class='text-white'>20,000+</strong> scans is a human story.\"",
            clinical_badge: "Discovery",
            clinical_title: "Pioneering breakthroughs are in our",
            clinical_desc: "From AI-powered diagnostics to precision imaging, our relentless pursuit of innovation drives every breakthrough in modern healthcare.",
            clinical_stat1: "AI Algorithms",
            clinical_stat2: "Patents Filed",
            products_title1: "Empowering Care.",
            products_title2: "Sustaining the Future.",
            products_desc: "Technology is only as powerful as the lives it touches.",
            tab_1: "01 Patient Focus",
            tab_2: "02 Innovation",
            tab_3: "03 Sustainability",
            tab1_title: "Patient Focus",
            tab1_desc: "At Siemens Healthineers, we design our diagnostic and therapeutic solutions around the human experience. By streamlining clinical workflows and reducing scan times, we help eliminate patient anxiety while empowering healthcare professionals to focus on what truly matters: delivering compassionate, personalized care.",
            tab1_feat1: "Reduced scan times by up to 50%",
            tab1_feat2: "AI-enhanced image clarity",
            tab1_feat3: "Ergonomic patient-first design",
            tab2_title: "Innovation at Scale",
            tab2_desc: "Our R&D investment of over €2 billion annually fuels groundbreaking advancements. From photon-counting CT to AI-native workflows, we push the boundaries of what's possible in healthcare technology.",
            tab3_title: "Sustainable Healthcare",
            tab3_desc: "We commit to reducing our environmental footprint while expanding access to care. Our energy-efficient systems and circular economy initiatives lead the way toward a greener healthcare industry.",
            platform_badge: "Platform Overview",
            platform_title: "How Our Website",
            platform_title2: "Works",
            platform_desc: "Our interactive platform is designed to provide seamless access to advanced healthcare technology. Explore our tools, discover cutting-edge solutions, and learn how we empower medical professionals with data-driven insights.",
            platform_step1_title: "1. Interactive Exploration",
            platform_step1_desc: "Navigate through our dynamic 3D modules and interactive data visualizations. Our intuitive interface allows you to explore complex medical technologies, MRI systems, and product specifications with ease.",
            platform_step2_title: "2. AI-Powered Insights",
            platform_step2_desc: "Leverage our built-in AI demonstrations to see automated diagnostics in action. We provide real-time feedback and intelligent recommendations to showcase how our technology enhances clinical decision-making.",
            platform_step3_title: "3. Seamless Connectivity",
            platform_step3_desc: "Connect directly with our specialists and request detailed product guides through our integrated contact portal. Our support network ensures you have the resources you need, exactly when you need them.",
            transform_title: "Transform Your Diagnostic Imaging Capabilities",
            transform_desc: "Empower your healthcare facility with Siemens MRI technology designed for precision imaging, intelligent workflows, and exceptional patient comfort.",
            transform_btn1: "Request a Product Guide",
            transform_btn2: "Contact Our Specialists",
            contact_title: "Ready to Transform Healthcare?",
            contact_desc: "Partner with us to bring cutting-edge medical technology to your facility. Our team is ready to help you take the next step.",
            contact_name: "Full Name",
            contact_age: "Age",
            contact_email: "Email Address",
            contact_opt_def: "What would you like to ask about?",
            contact_opt1: "General Health Care",
            contact_opt2: "Weight Conditioning",
            contact_opt3: "Medical Equipment",
            contact_opt4: "Book a Consultation",
            contact_opt5: "Other Inquiry",
            contact_submit: "Submit Inquiry",
            footer_desc: "Pioneering breakthroughs in healthcare. For everyone. Everywhere.",
            footer_prod: "Products",
            footer_prod1: "MRI Systems",
            footer_prod2: "CT Scanners",
            footer_prod3: "Ultrasound",
            footer_prod4: "X-ray",
            footer_conn: "Connect",
            footer_copy: "&copy; 2026 Siemens Healthineers. All rights reserved.",
            footer_link1: "Privacy",
            footer_link2: "Terms",
            footer_link3: "Cookies"
        },
        id: {
            nav_products: "Produk",
            nav_clinical: "Klinis",
            nav_about: "Tentang",
            nav_tell: "Beritahu Kami",
            nav_request: "Minta Konsultasi",
            hero_badge: "Dipercaya di Seluruh Dunia",
            hero_title_1: "Kami Memelopori",
            hero_title_2: "Terobosan Baru",
            hero_title_3: "dalam Perawatan Kesehatan",
            hero_desc: "Di Siemens Healthineers, kami memberdayakan penyedia layanan kesehatan di seluruh dunia untuk memberikan perawatan pasien berkualitas tinggi dan efisien melalui teknologi medis mutakhir.",
            hero_btn_request: "Minta Konsultasi",
            hero_btn_explore: "Jelajahi Produk",
            stat_1: "Negara Dilayani",
            stat_2: "Sistem Terpasang",
            stat_3: "Insinyur R&D",
            testimonial: "\"Di balik setiap <strong class='text-white'>20.000+</strong> pemindaian ini ada kisah manusia.\"",
            clinical_badge: "Penemuan",
            clinical_title: "Terobosan perintis ada dalam",
            clinical_desc: "Dari diagnostik berbasis AI hingga pencitraan presisi, upaya tanpa henti kami untuk berinovasi mendorong setiap terobosan dalam perawatan kesehatan modern.",
            clinical_stat1: "Algoritma AI",
            clinical_stat2: "Paten Terdaftar",
            products_title1: "Memberdayakan Perawatan.",
            products_title2: "Menjaga Masa Depan.",
            products_desc: "Teknologi hanya sekuat dampaknya pada kehidupan manusia.",
            tab_1: "01 Fokus pada Pasien",
            tab_2: "02 Inovasi",
            tab_3: "03 Keberlanjutan",
            tab1_title: "Fokus pada Pasien",
            tab1_desc: "Di Siemens Healthineers, kami merancang solusi diagnostik dan terapeutik dengan mengutamakan pengalaman manusia. Dengan menyederhanakan alur kerja klinis dan mengurangi waktu pemindaian, kami membantu menghilangkan kecemasan pasien dan memberdayakan tenaga medis untuk fokus pada hal yang paling penting: memberikan perawatan yang penuh kasih dan personal.",
            tab1_feat1: "Waktu pemindaian berkurang hingga 50%",
            tab1_feat2: "Kejernihan gambar yang ditingkatkan AI",
            tab1_feat3: "Desain ergonomis mengutamakan pasien",
            tab2_title: "Inovasi Skala Besar",
            tab2_desc: "Investasi R&D kami lebih dari &euro;2 miliar setiap tahun mendorong kemajuan yang luar biasa. Dari CT photon-counting hingga alur kerja berbasis AI, kami mendobrak batas-batas kemungkinan teknologi perawatan kesehatan.",
            tab3_title: "Kesehatan Berkelanjutan",
            tab3_desc: "Kami berkomitmen untuk mengurangi jejak lingkungan kami sembari memperluas akses perawatan. Sistem hemat energi dan inisiatif ekonomi sirkular kami memimpin menuju industri kesehatan yang lebih hijau.",
            platform_badge: "Ikhtisar Platform",
            platform_title: "Cara Kerja",
            platform_title2: "Website Kami",
            platform_desc: "Platform interaktif kami dirancang untuk memberikan akses lancar ke teknologi perawatan kesehatan mutakhir. Jelajahi alat kami, temukan solusi terkini, dan pelajari bagaimana kami memberdayakan tenaga medis dengan wawasan berbasis data.",
            platform_step1_title: "1. Eksplorasi Interaktif",
            platform_step1_desc: "Navigasi melalui modul 3D dinamis dan visualisasi data interaktif kami. Antarmuka intuitif kami memungkinkan Anda menjelajahi teknologi medis yang kompleks, sistem MRI, dan spesifikasi produk dengan mudah.",
            platform_step2_title: "2. Wawasan Berbasis AI",
            platform_step2_desc: "Manfaatkan demonstrasi AI bawaan kami untuk melihat diagnostik otomatis beraksi. Kami memberikan umpan balik waktu nyata dan rekomendasi cerdas untuk menunjukkan bagaimana teknologi kami meningkatkan pengambilan keputusan klinis.",
            platform_step3_title: "3. Konektivitas Tanpa Batas",
            platform_step3_desc: "Terhubung langsung dengan spesialis kami dan minta panduan produk yang detail melalui portal kontak terpadu kami. Jaringan dukungan kami memastikan Anda memiliki sumber daya yang Anda butuhkan, tepat saat Anda membutuhkannya.",
            transform_title: "Ubah Kemampuan Pencitraan Diagnostik Anda",
            transform_desc: "Berdayakan fasilitas kesehatan Anda dengan teknologi MRI Siemens yang dirancang untuk pencitraan presisi, alur kerja cerdas, dan kenyamanan pasien yang luar biasa.",
            transform_btn1: "Minta Panduan Produk",
            transform_btn2: "Hubungi Spesialis Kami",
            contact_title: "Siap Mengubah Layanan Kesehatan?",
            contact_desc: "Bermitralah dengan kami untuk menghadirkan teknologi medis mutakhir ke fasilitas Anda. Tim kami siap membantu Anda mengambil langkah berikutnya.",
            contact_name: "Nama Lengkap",
            contact_age: "Umur",
            contact_email: "Alamat Email",
            contact_opt_def: "Apa yang ingin Anda tanyakan?",
            contact_opt1: "Kesehatan Umum",
            contact_opt2: "Pengaturan Berat Badan",
            contact_opt3: "Peralatan Medis",
            contact_opt4: "Pesan Konsultasi",
            contact_opt5: "Pertanyaan Lainnya",
            contact_submit: "Kirim Permintaan",
            footer_desc: "Mempelopori terobosan dalam kesehatan. Untuk semua orang. Di mana saja.",
            footer_prod: "Produk",
            footer_prod1: "Sistem MRI",
            footer_prod2: "Pemindai CT",
            footer_prod3: "USG",
            footer_prod4: "Sinar-X",
            footer_conn: "Terhubung",
            footer_copy: "&copy; 2026 Siemens Healthineers. Hak Cipta Dilindungi Undang-Undang.",
            footer_link1: "Privasi",
            footer_link2: "Syarat",
            footer_link3: "Cookie"
        }
    };

    let currentLang = localStorage.getItem('language') || 'en';

    function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('language', lang);

        document.querySelectorAll('[data-i18n]').forEach(el => {
            if (!el.style.transition) {
                el.style.transition = 'opacity 0.3s ease';
            }
        });

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang] && translations[lang][key]) {
                el.style.opacity = '0';
                setTimeout(() => {
                    el.innerHTML = translations[lang][key];
                    el.style.opacity = '1';
                }, 300);
            }
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (translations[lang] && translations[lang][key]) {
                el.setAttribute('placeholder', translations[lang][key]);
            }
        });

        document.querySelectorAll('.lang-toggle').forEach(btn => {
            if (btn.classList.contains('w-full')) {
                btn.textContent = lang === 'en' ? 'Switch to Indonesian (ID)' : 'Ubah ke Bahasa Inggris (EN)';
            } else {
                btn.textContent = lang === 'en' ? 'ID' : 'EN';
            }
        });
    }

    document.querySelectorAll('.lang-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const newLang = currentLang === 'en' ? 'id' : 'en';
            setLanguage(newLang);
        });
    });

    if (currentLang === 'id') {
        setLanguage('id');
    }
});
