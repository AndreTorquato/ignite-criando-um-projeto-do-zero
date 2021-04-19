import { GetStaticProps } from 'next';
import { FiCalendar } from 'react-icons/fi';
import { FaUser } from 'react-icons/fa';
import { getPrismicClient } from '../services/prismic';
import { format } from 'date-fns';
import Prismic from '@prismicio/client'
import ptBr from 'date-fns/locale/pt-BR';
import Link from 'next/link';
import Head from 'next/head';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

import Header from '../components/Header';
import { useEffect, useState } from 'react';

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

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [formatPosts, setFormatPosts] = useState(true);

  useEffect(() => {
    const newPosts = postsPagination?.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date),
          "dd MMM yyy",
          { 
            locale: ptBr
          }
        ),
        data:{
          ...post.data
        }
      }
    });
    setPosts([...newPosts]);
  }, [postsPagination.next_page]);

  function loadMorePosts(){
    if(postsPagination.next_page){
      fetch(postsPagination.next_page)
      .then(response => response.json())
      .then(data => {
        postsPagination.next_page = data.next_page;
        postsPagination.results = [...postsPagination.results, ...data.results];
        setFormatPosts(!formatPosts);
      })
    }
  }
  return (
    <>
      <Head>
        <title>Spacetraveling | Home</title>
      </Head>
      <div className={`${styles.header} ${commonStyles.header}`}>
      <Header />
      </div>
      <section className={styles.posts}>
        { posts.map(post => (
        <Link href={`/post/${post.uid}`} key={post.uid}>
        <div className={styles.post}>
          <h2>{post.data.title}</h2>
          <p>{post.data.subtitle}</p>
           <div>
              <span className={commonStyles.info}>
                <FiCalendar/>
                {post.first_publication_date}
              </span>
              <span className={commonStyles.info}>
                <FaUser />
                {post.data.author}
              </span>
           </div>
        </div> 
        </Link>

        ))}
        { postsPagination?.next_page && <button type="button" onClick={loadMorePosts}>Carregar mais posts</button>}
      </section>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at("document.type", "posts")],
    {
      pageSize: 1
    }
  );
  const posts: Post[] = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author
      }
    }
  })

  const postsPagination: PostPagination = {
    next_page: postsResponse.next_page,
    results: posts
  }
  return {
    props: {
      postsPagination
    }
  }
};
