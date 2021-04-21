import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import { FiCalendar } from 'react-icons/fi';
import { FiClock } from 'react-icons/fi';
import { FaUser } from 'react-icons/fa';
import { format } from 'date-fns';
import Head from 'next/head';
import Header from '../../components/Header';
import ptBr from 'date-fns/locale/pt-BR';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { useEffect, useState } from 'react';

type Content = {
  content: {
    heading: string;
    body: {
      text: string;
    }[];
  }[];
}
interface Post {
  uid: string;
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    subtitle: string;
    author: string;
    content: Content;
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const [estimate, setEstimate] = useState<number>(0);
  useEffect(() => {
    
    
    post.first_publication_date = formatDate(post.first_publication_date);

    setEstimate(calculateReadingEstimate(post.data.content));
  }, []);


  function formatDate(date: string){
    return format(
      new Date(date),
      "dd MMM yyy",
      {
        locale: ptBr
      }
    );
  }

  function calculateReadingEstimate(content: Content){
  console.log(content);
    let allText = "";

    return 1;
  }
  return (
    <>
      <Head>
        <title>{post.data.title}</title>
      </Head>
      <div className={styles.content}>
        <Header />
        <div className={styles.container}>
          <div className="post">
            <div className="post_header">
              <img src={post.data.banner?.url} alt="image" />
            </div>
            <div className="post_header_info">
              <h1>{post.data.title}</h1>
              <div>
                <span className={commonStyles.info}>
                  <FiCalendar />
                  {post.first_publication_date}
                </span>
                <span className={commonStyles.info}>
                  <FaUser />
                  {post.data.author}
                </span>
                <span className={commonStyles.info}>
                  <FiClock />{estimate} min
                </span>
              </div>
            </div>
            <div
              dangerouslySetInnerHTML={{
                __html: post.data.content[0].body[0].text,
              }}
            ></div>
          </div>
        </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  // const posts = await prismic.query(TODO);

  return {
    paths: [{ params: { slug: 'post' } }],
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();
  const { slug } = params;
  const response = await prismic.getByUID('posts', String(slug), {});
  console.log(response);
  const post:Post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      author: response.data.author,
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner?.url,
      },
      content: response.data.content,
    },
  };
  return {
    props: {
      post,
    },
    revalidate: 60 * 30,
  };
};
