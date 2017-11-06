一直想着为多页应用搭建一个构建环境 ~ 以方便开发和打包 ~ 不然次次新开项目 ~ 都是拷贝复制 ~ 然后yy目录结构 ~ 也是呵呵哒~

>大致的需求如下：

- 自动生成目录结构
- es6的转码
- 可以在保存代码的时候自动刷新页面
- 将多个静态资源的引用合并
- 部署上线前~代码的压缩
- 图片优化

当然 ~ 除了这些常规的需求 ~ 可能还有些别的 ~ 比如样式扩展语言的编译 ~ 小图片图片转base64以减少请求数 ~ 这些可以根据具体需要来添加相应的配置。
暂时以上面的需求为例 ~ 配置gulpfile.js [gulpfile link](https://github.com/x-shadow-x/gulp_tool/blob/master/gulpfile.js) ~ 因为没有做成cli工具 ~ 故使用流程如下：
- 将gulpfile.js 和package.json放到项目更目录~
- 键入cnpm install 安装依赖包
- 键入gulp 会自动生成src目录结构并开启一个本地的服务器 ~ 然后就阔以敲代码啦


> 目录结构如下：

![dir.jpg](http://upload-images.jianshu.io/upload_images/2737146-db93671c195c8d72.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

> 部分解释

- 配置只涉及到一个gulpfile文件 ~ 并没有将配置代码拆分成多个文件 ~ 主要是在不做成cli工具的前提下 ~ 拆成的结果是需要手动导入多个文件整个构建流程才能运行起来
 ~ 总觉得怪怪的 ~ 

- 之前一般配置gulpfile都是按样式、脚本、图片、html来划分任务 ~ 这次做了一些调整 ~ 所有的任务都围绕html模板文件来展开 ~ 每个页面的html文件就有点类似于webpack的入口文件 ~ 处理的流程大致为：
1、首次运行构建任务的时候 ~ 项目中只有gulpfile.js 和 package.json配置文件 ~ 对应的任务通过检测src/.create文件是否存在来判断src目录结构是否已经创建 ~ 若没有 ~ 则创建 ~ 有则直接return结束当前任务
2、根据src目录构建dist目录并以dist目录并开启以一个服务器~打开index.html对应的页面

-  一般为了能方便访问首页~会将index.html抽出来单独放到根目录~但是这样经常面临index.html的静态资源的引用路径和其他页面不同 ~ 考虑一个场景比如有一堆脚本是所有页面都要引用的 ~ 那开发的时候不能每个页面都copy一次引用脚本的script标签 ~ 不然哪天因为某个需求 ~ 要给每个页面都加一个新的脚本的时候 ~ 那就呵呵了 ~ 一个一个页面点开来加script标签~ ~此时~如果有一个供所有页面引用的html文件（对应目录结构中的common_script.html） ~ 专门用来引用公共的脚本 ~ 那就很方便改一处就好了 ~ 刚好再结合gulp-useref插件~阔以将这些脚本合成一个以便减少请求数目 ~ 好像一切都刚刚好 ~ 但是哪个单独抽出去的index.html因为相对路径和其他页面不一样 ~ 这时common_script.html就不好写了 ~ 暂时我的处理方式是在src目录下
 ~ index.html和其他页面放在平级目录下 ~ 编译到dist文件夹时再单独将index.html输出到dist根目录下 ~ 这样common_script.html中资源的引用路径就木有问题啦 ~ 结合gulp-plumber插件~可以自动将src目录下对静态资源的引用处理好而无需手动到dist目录下去修改资源引用的路径

- package.json中scripts选项的配置 ~ 原本createDir这个任务是写到gulpfile中默认任务的中括号依赖中的 ~ 后来发觉 ~ createDir这个任务中创建目录和文件的操作是异步的 ~ 就算放到中括号依赖中 ~ 程序好像也不会等到目录创建好才去执行下面的任务 ~ 导致后面的编译操作那些都木有正确执行 ~ dist目录也木有出来 ~ 那就不好玩了 ~ （此处yy ~ 可能是生成目录和写文件存在异步操作 ~ 但是任务最后又木有return stream ~ 导致gulp不会等异步任务执行完 ~ 但是我一个创建目录的任务 ~ 好像也没得return什么stream ~ 后来也想过Promise之类的控制异步处理 ~ 不过因为要生成很多目录以及文件同时各自又都是异步的 ~ 好像也挺呵呵的 ~ 后来 ~ 突发奇想 ~能不能将生成目录的gulp任务配置到package.json中 ~ 在那里做任务执行顺序的控制 ~ 一部小心 ~ 成了 ~ 总有一种 my code don't work i don't know why~my code work i don't know why的赶脚。。。。。anyway~具体原因还不是非常清楚 ~ 后续查明再补上）
> 结束

原本很喜欢webpack的打包的功能 ~ 在处理脚本依赖和动态加载对应模块方面 ~ 各种赞 ~ 奈何在多页应用的场景下 ~ 没有找到很好的导入公共头部尾部html文件的webpack loader（也许一直都在 ~ 只是笔者还没找到）~ 而恰巧 ~ gulp方面可以很方便地使用gulp-file-include插件引入公共的html文件 ~ 同时 ~ 结合gulp-useref ~ 可以通过类似注释的形式将多个文件合并成一个并在此基础上处理 ~ 也是各种舒服（虽然只是模拟~并没有webpack打包机制那么强大）
考虑到笔者是那种今晚写的代码明天就不是自己的了的特殊体制 ~ 特地记录下 ~ 方面以后查看。
完整配置文件地址：https://github.com/x-shadow-x/gulp_tool 可以在词基础上编写自己喜欢的配置文件 ~ 如果有什么建议或问题 ~ 欢迎提issue

~最后 ~ 如果你觉得还过得去 ~ 就赏个星星吧~~
