import React, { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Language, ThemeMode, UserRole } from '../../types/procurement';
import { createConfiguredRenderer, detectSoftwareWebGL, disposeSceneResources } from './threeUtils';

export interface PortalCardSpec {
  role: UserRole;
  index: string;
  deptEn: string;
  deptAr: string;
}

interface LoginRoleCardsSceneProps {
  theme: ThemeMode;
  lang: Language;
  portals: PortalCardSpec[];
  selectedRole: UserRole | null;
  onSelectRole: (role: UserRole) => void;
  liveEmail: string;
  livePassword: string;
  showPwd: boolean;
}

interface CardSlot {
  x: number;
  y: number;
  z: number;
  rotY: number;
  rotZ: number;
}

interface CardNode {
  role: UserRole;
  group: THREE.Group;
  hitMesh: THREE.Mesh;
  slot: CardSlot;
  faceMat: THREE.MeshBasicMaterial;
  bevelMat: THREE.MeshLambertMaterial;
  haloMat: THREE.MeshBasicMaterial;
  reticleGroup: THREE.Group;
  reticleMat: THREE.MeshBasicMaterial;
  shadowMat: THREE.MeshBasicMaterial;
}

const _pointer = new THREE.Vector2();
const _targetFaceTint = new THREE.Color();
const _targetBevelTint = new THREE.Color();

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function createRoundedCardShape(width: number, height: number, radius: number): THREE.Shape {
  const x = -width / 2;
  const y = -height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

function createRadialShadowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 16, 128, 128, 124);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
    grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createRadialGlowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(256, 256, 24, 256, 256, 248);
    grad.addColorStop(0, 'rgba(227, 34, 54, 0.72)');
    grad.addColorStop(0.35, 'rgba(227, 34, 54, 0.34)');
    grad.addColorStop(0.68, 'rgba(227, 34, 54, 0.08)');
    grad.addColorStop(1, 'rgba(227, 34, 54, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createPaperGrainCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  if (ctx) {
    const img = ctx.createImageData(256, 256);
    const data = img.data;
    // Deterministic subtle uncoated cotton paper grain
    let seed = 1337;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < data.length; i += 4) {
      const n = rand();
      if (n > 0.62) {
        data[i] = 255;
        data[i + 1] = 253;
        data[i + 2] = 248;
        data[i + 3] = Math.floor((n - 0.62) * 32);
      } else if (n < 0.38) {
        data[i] = 120;
        data[i + 1] = 114;
        data[i + 2] = 102;
        data[i + 3] = Math.floor((0.38 - n) * 26);
      } else {
        data[i + 3] = 0;
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  return c;
}

function computeCameraZ(width: number, height: number, fovDeg: number): number {
  const aspect = Math.max(width / Math.max(height, 1), 0.85);
  const halfTan = Math.tan(THREE.MathUtils.degToRad(fovDeg / 2));
  const neededForHeight = 2.02 / halfTan;
  const neededForWidth = 3.24 / (halfTan * aspect);
  return Math.max(6.85, neededForHeight, neededForWidth);
}

export const LoginRoleCardsScene: React.FC<LoginRoleCardsSceneProps> = ({
  theme,
  lang,
  portals,
  selectedRole,
  onSelectRole,
  liveEmail,
  livePassword,
  showPwd
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const selectedRoleRef = useRef<UserRole | null>(selectedRole);
  selectedRoleRef.current = selectedRole;

  const onSelectRoleRef = useRef(onSelectRole);
  onSelectRoleRef.current = onSelectRole;

  const langRef = useRef(lang);
  langRef.current = lang;

  const liveEmailRef = useRef(liveEmail);
  liveEmailRef.current = liveEmail;

  const livePasswordRef = useRef(livePassword);
  livePasswordRef.current = livePassword;

  const showPwdRef = useRef(showPwd);
  showPwdRef.current = showPwd;

  const texturesRef = useRef<Record<string, THREE.CanvasTexture>>({});
  const canvasesRef = useRef<Record<string, HTMLCanvasElement>>({});
  const paperGrainRef = useRef<HTMLCanvasElement | null>(null);

  // Render at 3x High-DPI Resolution (1680 x 1380 -> 560 x 460 logical) for razor-sharp ink on heavy-stock matte paper
  const drawCardTexture = useCallback(
    (
      canvas: HTMLCanvasElement,
      portal: PortalCardSpec,
      isSelected: boolean,
      emailVal: string,
      pwdVal: string,
      revealPwd: boolean,
      currentTheme: ThemeMode,
      currentLang: Language
    ) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const isDark = currentTheme === 'dark';
      const isAr = currentLang === 'ar';
      const logicalW = 560;
      const logicalH = 460;
      const scale = canvas.width / logicalW;

      if (!paperGrainRef.current) {
        paperGrainRef.current = createPaperGrainCanvas();
      }

      ctx.save();
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.clearRect(0, 0, logicalW, logicalH);

      roundRectPath(ctx, 4, 4, logicalW - 8, logicalH - 8, 22);
      ctx.save();
      ctx.clip();

      // Heavy-stock matte paper base matched to theme: matte charcoal paper in dark mode, crisp white cotton paper in light mode
      ctx.fillStyle = isDark ? '#151821' : '#FFFFFF';
      ctx.fillRect(0, 0, logicalW, logicalH);

      // Subtle tactile cotton paper fiber grain overlay
      const pattern = ctx.createPattern(paperGrainRef.current, 'repeat');
      if (pattern) {
        ctx.save();
        ctx.globalAlpha = isDark ? 0.3 : 0.85;
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, logicalW, logicalH);
        ctx.restore();
      }

      // Header Row: PROCURA Wordmark + Portal Index (no red top stripe)
      ctx.textBaseline = 'alphabetic';
      ctx.direction = 'ltr';
      ctx.textAlign = isAr ? 'right' : 'left';
      ctx.fillStyle = isDark ? '#FFFFFF' : '#0E1117';
      ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('PROCURA', isAr ? logicalW - 36 : 36, 48);

      ctx.textAlign = isAr ? 'left' : 'right';
      ctx.fillStyle = isSelected ? '#E32236' : isDark ? '#9EA6B8' : '#5E6675';
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.fillText(`PORTAL ${portal.index}`, isAr ? 36 : logicalW - 36, 48);

      // Crisp printed hairline under dossier header
      ctx.strokeStyle = isDark ? '#262C3A' : '#E2E6ED';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(36, 66);
      ctx.lineTo(logicalW - 36, 66);
      ctx.stroke();

      const titleMap: Record<Language, Record<UserRole, string>> = {
        en: {
          requester: 'Requester',
          officer: 'Procurement Officer',
          manager: 'Executive Approver',
          supplier: 'Supplier Portal'
        },
        ar: {
          requester: 'مقدّم الطلب',
          officer: 'مسؤول المشتريات',
          manager: 'المدير المعتمد',
          supplier: 'بوابة المورد'
        }
      };

      const subtitleMap: Record<Language, Record<UserRole, string>> = {
        en: {
          requester: 'Capital Requisitions & Tracking',
          officer: 'Tenders, AI Review & Benchmarks',
          manager: 'Budget & Award Authorization',
          supplier: 'Tender Bids & PDF Quotations'
        },
        ar: {
          requester: 'إنشاء ومتابعة طلبات الشراء',
          officer: 'إدارة المناقصات ومقارنة العروض',
          manager: 'اعتماد الميزانيات وقرارات الترسية',
          supplier: 'تقديم عروض الأسعار بصيغة PDF'
        }
      };

      const textAnchorX = isAr ? logicalW - 36 : 36;
      ctx.direction = isAr ? 'rtl' : 'ltr';
      ctx.textAlign = isAr ? 'right' : 'left';

      // Razor-sharp Role Heading
      ctx.fillStyle = isDark ? '#FFFFFF' : '#0E1117';
      ctx.font = '800 32px "Plus Jakarta Sans", "IBM Plex Sans Arabic", sans-serif';
      ctx.fillText(titleMap[currentLang][portal.role], textAnchorX, 118);

      ctx.fillStyle = isDark ? '#A8B1C2' : '#4B5563';
      ctx.font = '500 16px "Plus Jakarta Sans", "IBM Plex Sans Arabic", sans-serif';
      ctx.fillText(subtitleMap[currentLang][portal.role], textAnchorX, 148);

      // Matte Dossier Work Email Field
      roundRectPath(ctx, 32, 182, logicalW - 64, 74, 10);
      ctx.fillStyle = isDark
        ? isSelected
          ? '#0D1016'
          : '#10131B'
        : isSelected
        ? '#FFFFFF'
        : '#F4F6F9';
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#E32236' : isDark ? '#2D3444' : '#CFD6E0';
      ctx.lineWidth = isSelected ? 2 : 1.5;
      ctx.stroke();

      ctx.direction = 'ltr';
      ctx.textAlign = 'left';
      ctx.fillStyle = isSelected ? '#E32236' : isDark ? '#9EA6B8' : '#5E6675';
      ctx.font = '700 11px "JetBrains Mono", "IBM Plex Sans Arabic", sans-serif';
      ctx.fillText('WORK EMAIL', 48, 205);

      const hasEmail = isSelected && emailVal.trim().length > 0;
      const emailDisplay = isSelected
        ? hasEmail
          ? emailVal.slice(0, 32)
          : isAr
          ? 'أدخل البريد المؤسسي...'
          : 'name@company.com'
        : isAr
        ? portal.deptAr
        : portal.deptEn;

      ctx.direction = isAr && !hasEmail ? 'rtl' : 'ltr';
      ctx.textAlign = isAr && !hasEmail ? 'right' : 'left';
      const emailAnchorX = isAr && !hasEmail ? logicalW - 48 : 48;
      ctx.fillStyle =
        hasEmail || !isSelected
          ? isDark
            ? '#FFFFFF'
            : '#0E1117'
          : isDark
          ? '#6E7789'
          : '#7C8391';
      ctx.font = '600 17px "JetBrains Mono", "IBM Plex Sans Arabic", sans-serif';
      ctx.fillText(emailDisplay, emailAnchorX, 237);

      // Matte Dossier Password Field
      roundRectPath(ctx, 32, 272, logicalW - 64, 74, 10);
      ctx.fillStyle = isDark
        ? isSelected
          ? '#0D1016'
          : '#10131B'
        : isSelected
        ? '#FFFFFF'
        : '#F4F6F9';
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#E32236' : isDark ? '#2D3444' : '#CFD6E0';
      ctx.lineWidth = isSelected ? 2 : 1.5;
      ctx.stroke();

      ctx.direction = 'ltr';
      ctx.textAlign = 'left';
      ctx.fillStyle = isSelected ? '#E32236' : isDark ? '#9EA6B8' : '#5E6675';
      ctx.font = '700 11px "JetBrains Mono", "IBM Plex Sans Arabic", sans-serif';
      ctx.fillText('PASSWORD', 48, 295);

      const hasPwd = isSelected && pwdVal.length > 0;
      const pwdDisplay = isSelected
        ? hasPwd
          ? (revealPwd ? pwdVal : '•'.repeat(pwdVal.length)).slice(0, 28)
          : isAr
          ? 'أدخل كلمة المرور...'
          : '••••••••••••'
        : '••••••••••••';

      ctx.direction = isAr && isSelected && !hasPwd ? 'rtl' : 'ltr';
      ctx.textAlign = isAr && isSelected && !hasPwd ? 'right' : 'left';
      const pwdAnchorX = isAr && isSelected && !hasPwd ? logicalW - 48 : 48;
      ctx.fillStyle = hasPwd
        ? isDark
          ? '#FFFFFF'
          : '#0E1117'
        : isDark
        ? '#6E7789'
        : '#7C8391';
      ctx.font = '600 17px "JetBrains Mono", "IBM Plex Sans Arabic", sans-serif';
      ctx.fillText(pwdDisplay, pwdAnchorX, 327);

      // Footer Status Row
      ctx.direction = isAr ? 'rtl' : 'ltr';
      ctx.textAlign = isAr ? 'right' : 'left';
      ctx.fillStyle = isSelected ? '#E32236' : isDark ? '#FFFFFF' : '#0E1117';
      ctx.font = '700 13px "JetBrains Mono", "IBM Plex Sans Arabic", sans-serif';
      const actionLabel = isSelected
        ? isAr
          ? '● بوابة الدخول المحددة'
          : '● ACTIVE SIGN-IN PORTAL'
        : isAr
        ? 'اضغط لاختيار البوابة والدخول ←'
        : 'SELECT PORTAL TO SIGN IN →';
      ctx.fillText(actionLabel, textAnchorX, 412);

      ctx.restore();

      // Crisp Paper Card Outer Border
      roundRectPath(ctx, 4, 4, logicalW - 8, logicalH - 8, 22);
      ctx.strokeStyle = isSelected ? '#E32236' : isDark ? '#2E3545' : '#CBD5E1';
      ctx.lineWidth = isSelected ? 3.5 : 2;
      ctx.stroke();

      ctx.restore();
    },
    []
  );

  // Redraw card faces cleanly when props change without recreating the WebGL context
  useEffect(() => {
    portals.forEach((p) => {
      const canvas = canvasesRef.current[p.role];
      const tex = texturesRef.current[p.role];
      if (canvas && tex) {
        drawCardTexture(
          canvas,
          p,
          selectedRole === p.role,
          liveEmail,
          livePassword,
          showPwd,
          theme,
          lang
        );
        tex.needsUpdate = true;
      }
    });
  }, [portals, selectedRole, liveEmail, livePassword, showPwd, theme, lang, drawCardTexture]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let frameId = 0;
    let disposed = false;
    let renderer: THREE.WebGLRenderer | undefined;
    const scene = new THREE.Scene();

    try {
      const width = container.clientWidth || 720;
      const height = container.clientHeight || 480;
      const isDark = theme === 'dark';
      const isSoftwareGl = detectSoftwareWebGL();

      const cameraFov = 31;
      const camera = new THREE.PerspectiveCamera(cameraFov, width / height, 0.1, 50);
      camera.position.set(0, 0.04, computeCameraZ(width, height, cameraFov));

      renderer = createConfiguredRenderer(width, height, isSoftwareGl);
      container.appendChild(renderer.domElement);

      const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

      // Pure Matte Lighting for Paper Cardstock Edge Bevels
      scene.add(new THREE.AmbientLight(0xffffff, isDark ? 0.65 : 0.85));
      const keyLight = new THREE.DirectionalLight(0xffffff, isDark ? 0.75 : 0.65);
      keyLight.position.set(-4, 6, 6);
      scene.add(keyLight);

      const stageGroup = new THREE.Group();
      scene.add(stageGroup);

      // Shared geometries (560 x 460 ratio -> 2.38 x 1.955) with crisp heavy-stock paper thickness
      const cardW = 2.38;
      const cardH = 1.955;
      const cardShape = createRoundedCardShape(cardW, cardH, 0.1);
      const chassisGeo = new THREE.ExtrudeGeometry(cardShape, {
        depth: 0.028,
        bevelEnabled: true,
        bevelThickness: 0.006,
        bevelSize: 0.006,
        bevelSegments: 2,
        curveSegments: 18
      });
      chassisGeo.translate(0, 0, -0.034);

      const faceGeo = new THREE.PlaneGeometry(cardW, cardH);
      const haloGeo = new THREE.PlaneGeometry(cardW + 0.95, cardH + 0.85);
      const shadowGeo = new THREE.PlaneGeometry(2.7, 0.8);
      const shadowTex = createRadialShadowTexture();
      const haloTex = createRadialGlowTexture();

      const clickableMeshes: THREE.Mesh[] = [];
      const cardNodes: CardNode[] = [];

      const baseSlots: CardSlot[] = [
        { x: -1.46, y: 1.06, z: 0.06, rotY: 0.08, rotZ: 0.01 },
        { x: 1.46, y: 1.06, z: -0.04, rotY: -0.08, rotZ: -0.01 },
        { x: -1.46, y: -1.04, z: -0.04, rotY: 0.07, rotZ: -0.01 },
        { x: 1.46, y: -1.04, z: 0.06, rotY: -0.07, rotZ: 0.01 }
      ];

      portals.forEach((portal, idx) => {
        // 3x High-DPI Resolution (1680 x 1380)
        const canvas = document.createElement('canvas');
        canvas.width = 1680;
        canvas.height = 1380;
        canvasesRef.current[portal.role] = canvas;

        drawCardTexture(
          canvas,
          portal,
          selectedRoleRef.current === portal.role,
          liveEmailRef.current,
          livePasswordRef.current,
          showPwdRef.current,
          theme,
          langRef.current
        );

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = maxAnisotropy;
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texturesRef.current[portal.role] = texture;

        const cardGroup = new THREE.Group();
        const slot = baseSlots[idx % baseSlots.length];
        cardGroup.position.set(slot.x, slot.y, slot.z);
        cardGroup.rotation.set(0, slot.rotY, slot.rotZ);
        stageGroup.add(cardGroup);

        // 1. Heavy-Stock Uncoated Paperboard Edge Chassis matched cleanly to theme
        const bevelMat = new THREE.MeshLambertMaterial({
          color: isDark ? 0x202532 : 0xdce1e8
        });
        const chassisMesh = new THREE.Mesh(chassisGeo, bevelMat);
        cardGroup.add(chassisMesh);

        // 2. Heavy-Stock Matte Paper Faceplate (MeshBasicMaterial + alphaTest: 0.5 + toneMapped: false)
        const faceMat = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: false,
          alphaTest: 0.5,
          toneMapped: false
        });
        const faceMesh = new THREE.Mesh(faceGeo, faceMat);
        faceMesh.position.z = 0.004;
        faceMesh.userData = { role: portal.role };
        cardGroup.add(faceMesh);
        clickableMeshes.push(faceMesh);

        // 3. Soft Radial-Gradient Crimson Back-Light Halo
        const haloMat = new THREE.MeshBasicMaterial({
          map: haloTex,
          color: 0xffffff,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          toneMapped: false
        });
        const haloMesh = new THREE.Mesh(haloGeo, haloMat);
        haloMesh.position.z = -0.07;
        cardGroup.add(haloMesh);

        // 4. Precision Corner Reticle Brackets
        const reticleGroup = new THREE.Group();
        const reticleMat = new THREE.MeshBasicMaterial({
          color: 0xe32236,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          toneMapped: false
        });
        const bx = cardW / 2 + 0.075;
        const by = cardH / 2 + 0.075;
        const bracketConfigs = [
          { x: -bx, y: by, w: 0.22, h: 0.024, ox: 0.098, oy: -0.098 },
          { x: bx, y: by, w: 0.22, h: 0.024, ox: -0.098, oy: -0.098 },
          { x: -bx, y: -by, w: 0.22, h: 0.024, ox: 0.098, oy: 0.098 },
          { x: bx, y: -by, w: 0.22, h: 0.024, ox: -0.098, oy: 0.098 }
        ];
        bracketConfigs.forEach((b) => {
          const hBar = new THREE.Mesh(new THREE.PlaneGeometry(b.w, b.h), reticleMat);
          hBar.position.set(b.x + b.ox, b.y, 0.02);
          const vBar = new THREE.Mesh(new THREE.PlaneGeometry(b.h, b.w), reticleMat);
          vBar.position.set(b.x, b.y + b.oy, 0.02);
          reticleGroup.add(hBar, vBar);
        });
        cardGroup.add(reticleGroup);

        // 5. Contact Shadow Grounding
        const shadowMat = new THREE.MeshBasicMaterial({
          map: shadowTex,
          transparent: true,
          opacity: isDark ? 0.58 : 0.22,
          depthWrite: false
        });
        const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
        shadowMesh.position.set(0, -cardH / 2 - 0.18, -0.25);
        shadowMesh.rotation.x = -Math.PI / 2.2;
        cardGroup.add(shadowMesh);

        cardNodes.push({
          role: portal.role,
          group: cardGroup,
          hitMesh: faceMesh,
          slot,
          faceMat,
          bevelMat,
          haloMat,
          reticleGroup,
          reticleMat,
          shadowMat
        });
      });

      if (!isSoftwareGl) {
        renderer.compile(scene, camera);
      }

      const raycaster = new THREE.Raycaster();
      let hoveredRole: UserRole | null = null;
      let pointerNdcX = 0;
      let pointerNdcY = 0;
      let lastRaycast = 0;

      const handlePointerMove = (e: PointerEvent) => {
        const rect = container.getBoundingClientRect();
        pointerNdcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointerNdcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        const now = performance.now();
        if (now - lastRaycast < 35) return;
        lastRaycast = now;
        _pointer.set(pointerNdcX, pointerNdcY);
        raycaster.setFromCamera(_pointer, camera);
        const hits = raycaster.intersectObjects(clickableMeshes, false);
        hoveredRole = hits.length > 0 ? (hits[0].object.userData.role as UserRole) : null;
        container.style.cursor = hoveredRole ? 'pointer' : 'default';
      };

      const handlePointerLeave = () => {
        hoveredRole = null;
        pointerNdcX = 0;
        pointerNdcY = 0;
        container.style.cursor = 'default';
      };

      const handleClick = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        _pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        _pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(_pointer, camera);
        const hits = raycaster.intersectObjects(clickableMeshes, false);
        if (hits.length > 0 && hits[0].object.userData.role) {
          onSelectRoleRef.current(hits[0].object.userData.role as UserRole);
        }
      };

      container.addEventListener('pointermove', handlePointerMove);
      container.addEventListener('pointerleave', handlePointerLeave);
      container.addEventListener('click', handleClick);

      const handleResize = () => {
        if (!container || !renderer || disposed) return;
        const w = container.clientWidth || 720;
        const h = container.clientHeight || 480;
        camera.aspect = w / h;
        camera.position.z = computeCameraZ(w, h, cameraFov);
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', handleResize);

      const resizeObserver =
        typeof ResizeObserver !== 'undefined'
          ? new ResizeObserver(() => handleResize())
          : null;
      resizeObserver?.observe(container);

      const afterDraw = (cb: () => void) => {
        if (!renderer || disposed) return;
        const gl = renderer.getContext() as WebGL2RenderingContext;
        if (!gl || !gl.fenceSync) {
          frameId = window.setTimeout(cb, 80);
          return;
        }
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) {
            if (sync) gl.deleteSync(sync);
            return;
          }
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      };

      const clock = new THREE.Clock();
      const tick = () => {
        if (disposed) return;
        const dt = Math.min(clock.getDelta(), 0.05);
        const t = clock.elapsedTime;
        const activeRole = selectedRoleRef.current;
        const isAr = langRef.current === 'ar';

        stageGroup.rotation.y = THREE.MathUtils.damp(
          stageGroup.rotation.y,
          pointerNdcX * 0.045,
          5,
          dt
        );
        stageGroup.rotation.x = THREE.MathUtils.damp(
          stageGroup.rotation.x,
          -pointerNdcY * 0.03,
          5,
          dt
        );

        let sideIdx = 0;

        cardNodes.forEach((node, idx) => {
          const isSelected = activeRole === node.role;
          const isHovered = hoveredRole === node.role;
          const isDimmed = Boolean(activeRole && !isSelected);
          const floatOffset = Math.sin(t * 1.1 + idx * 1.45) * 0.025;

          let targetX: number;
          let targetY: number;
          let targetZ: number;
          let targetRotY: number;
          let targetRotX: number;
          let targetRotZ: number;
          let targetScale: number;

          if (!activeRole) {
            targetX = node.slot.x;
            targetY = node.slot.y + floatOffset;
            targetZ = node.slot.z + (isHovered ? 0.28 : 0);
            targetRotY = isHovered ? 0 : node.slot.rotY;
            targetRotX = isHovered ? -pointerNdcY * 0.055 : 0;
            targetRotZ = isHovered ? 0 : node.slot.rotZ;
            targetScale = isHovered ? 1.05 : 1.0;
          } else if (isSelected) {
            targetX = isAr ? -0.58 : 0.58;
            targetY = floatOffset * 0.45;
            targetZ = 1.6;
            targetRotY = isAr ? 0.05 : -0.05;
            targetRotX = isHovered ? -pointerNdcY * 0.04 : 0;
            targetRotZ = 0;
            targetScale = 1.18;
          } else {
            const stackY = 1.24 - sideIdx * 1.24;
            targetX = isAr ? 1.98 : -1.98;
            targetY = stackY + floatOffset * 0.35;
            targetZ = isHovered ? 0.14 : -0.25;
            targetRotY = isAr ? -0.14 : 0.14;
            targetRotX = 0;
            targetRotZ = 0;
            targetScale = isHovered ? 0.62 : 0.56;
            sideIdx++;
          }

          node.group.position.x = THREE.MathUtils.damp(node.group.position.x, targetX, 7, dt);
          node.group.position.y = THREE.MathUtils.damp(node.group.position.y, targetY, 7, dt);
          node.group.position.z = THREE.MathUtils.damp(node.group.position.z, targetZ, 7, dt);

          node.group.rotation.x = THREE.MathUtils.damp(node.group.rotation.x, targetRotX, 7, dt);
          node.group.rotation.y = THREE.MathUtils.damp(node.group.rotation.y, targetRotY, 7, dt);
          node.group.rotation.z = THREE.MathUtils.damp(node.group.rotation.z, targetRotZ, 7, dt);

          const nextScale = THREE.MathUtils.damp(node.group.scale.x, targetScale, 7, dt);
          node.group.scale.set(nextScale, nextScale, nextScale);

          // Dim unselected stacked paper cards softly in depth (opaque shaded paper matching active theme)
          _targetFaceTint.setHex(
            isDimmed ? (isHovered ? (isDark ? 0xd8dde6 : 0xebeff5) : isDark ? 0x9aa1af : 0xd2d8e2) : 0xffffff
          );
          node.faceMat.color.lerp(_targetFaceTint, 1 - Math.exp(-8 * dt));

          _targetBevelTint.setHex(
            isDimmed
              ? isDark
                ? 0x151822
                : 0xbac2cf
              : isDark
              ? 0x202532
              : 0xdce1e8
          );
          node.bevelMat.color.lerp(_targetBevelTint, 1 - Math.exp(-8 * dt));

          const targetHalo = isSelected ? 0.45 : isHovered ? 0.16 : 0;
          node.haloMat.opacity = THREE.MathUtils.damp(node.haloMat.opacity, targetHalo, 8, dt);

          const targetReticle = isSelected ? 0.92 : isHovered ? 0.36 : 0;
          node.reticleMat.opacity = THREE.MathUtils.damp(
            node.reticleMat.opacity,
            targetReticle,
            8,
            dt
          );
          const targetReticleScale = isSelected ? 1.0 : 1.03;
          const nextReticleScale = THREE.MathUtils.damp(
            node.reticleGroup.scale.x,
            targetReticleScale,
            8,
            dt
          );
          node.reticleGroup.scale.set(nextReticleScale, nextReticleScale, 1);

          const targetShadow = isSelected
            ? isDark
              ? 0.65
              : 0.24
            : isDimmed
            ? isDark
              ? 0.22
              : 0.12
            : isDark
            ? 0.42
            : 0.16;
          node.shadowMat.opacity = THREE.MathUtils.damp(
            node.shadowMat.opacity,
            targetShadow,
            8,
            dt
          );
        });

        renderer?.render(scene, camera);

        if (isSoftwareGl) {
          afterDraw(tick);
        } else {
          frameId = requestAnimationFrame(tick);
        }
      };

      tick();

      return () => {
        disposed = true;
        cancelAnimationFrame(frameId);
        clearTimeout(frameId);
        resizeObserver?.disconnect();
        container.removeEventListener('pointermove', handlePointerMove);
        container.removeEventListener('pointerleave', handlePointerLeave);
        container.removeEventListener('click', handleClick);
        window.removeEventListener('resize', handleResize);
        shadowTex.dispose();
        haloTex.dispose();
        Object.values(texturesRef.current).forEach((tx) => tx.dispose());
        texturesRef.current = {};
        canvasesRef.current = {};
        disposeSceneResources(scene, renderer, container);
      };
    } catch (e) {
      console.warn('LoginRoleCardsScene initialization skipped:', e);
    }
  }, [theme, portals, drawCardTexture]);

  return <div ref={mountRef} className="w-full h-[420px] sm:h-[470px] lg:h-[510px]" />;
};
