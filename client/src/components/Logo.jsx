/**
 * Logo Jawarga — Menggunakan gambar logo.jpg baru dengan gaya Neo-Brutalist
 */
export default function Logo({ size = 48 }) {
    return (
        <img 
            src="/logo.jpg" 
            alt="Logo Jawarga" 
            style={{ 
                width: `${size}px`, 
                height: `${size}px`, 
                objectFit: 'cover', 
                borderRadius: '18px',
                border: '3px solid var(--color-ink-black, #2c2e2a)',
                boxShadow: 'var(--shadow-card, 4px 4px 0px #000)',
                backgroundColor: 'var(--color-pure-white, #ffffff)'
            }} 
        />
    );
}
