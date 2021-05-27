export default async (req, res)  => {
  res.clearPreviewData();

  res.writeHead(307, { Loaction: "/"});
  res.end();
}