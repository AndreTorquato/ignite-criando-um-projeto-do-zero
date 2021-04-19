import { GetStaticProps } from 'next';
import { FiCalendar } from 'react-icons/fi';
import { FaUser } from 'react-icons/fa';
import Link from 'next/link';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home() {
  // TODO
  return (
    <>
      <div className={`${styles.header} ${commonStyles.header}`}>
      <Header />
      </div>
      <section className={styles.posts}>
        <Link href="/">
        <div className={styles.post}>
          <h2>Como utilizar Hooks</h2>
          <p>Pensando em sincronizar em vez de ciclos de vida.</p>
           <div>
              <span className={commonStyles.info}>
                <FiCalendar/>
                19 Abr 2021
              </span>
              <span className={commonStyles.info}>
                <FaUser />
                André Torquato
              </span>
           </div>
        </div> 
        </Link>
        <button type="button">Carregar mais posts</button>
      </section>
    </>
  );
}

// export const getStaticProps = async () => {
//   // const prismic = getPrismicClient();
//   // const postsResponse = await prismic.query(TODO);

//   // TODO
// };
