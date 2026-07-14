/**
 * Logo Jawarga — Menggunakan gambar logo.jpg baru dengan gaya Neo-Brutalist
 */
export default function Logo({ size = 48, hasShadow = true, hasBorder = true, rounded = false }) {
    const radius = rounded ? '50%' : '14px';
    return (
        <img 
            src="/logo.jpg" 
            alt="Logo Jawarga" 
            style={{ 
                width: `${size}px`, 
                height: `${size}px`, 
                objectFit: 'cover', 
                borderRadius: radius,
                border: hasBorder ? '2.5px solid var(--color-ink-black, #2c2e2a)' : 'none',
                boxShadow: hasShadow ? 'var(--shadow-card, 4px 4px 0px #000)' : 'none',
                backgroundColor: 'var(--color-pure-white, #ffffff)'
            }} 
        />
    );
}
