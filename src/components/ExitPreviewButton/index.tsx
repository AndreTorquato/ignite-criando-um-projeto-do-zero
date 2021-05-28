import Link from 'next/link';
import styles from './preview-button.module.scss';

export function ExitPreviewButton(){
  return (
    <aside className={styles.btn}>
      <Link href="/api/exit-preview">
        <a>Sair do modo preview</a>
      </Link>
    </aside>
  )
}