# 使用官方极简版的 Nginx 镜像作为基础
FROM nginx:alpine

# 清理 Nginx 默认的默认静态页面（可选，为了更干净）
RUN rm -rf /usr/share/nginx/html/*

# 将刚刚通过 Vite 打包生成的 dist 目录下的所有文件，复制到 Nginx 的网页托管目录
COPY dist /usr/share/nginx/html

# 暴露容器内部的 80 端口
EXPOSE 80

# 启动 Nginx 服务
CMD ["nginx", "-g", "daemon off;"]