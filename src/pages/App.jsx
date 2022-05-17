/*
 * @Author: fzf404
 * @Date: 2022-04-23 19:52:16
 * @LastEditTime: 2022-05-11 19:10:44
 * @Description: 主页
 */
import { useState, useEffect } from 'react'
import YAML from 'yaml'
import UrlParse from 'url-parse'

// 组件库
import {
  Spin,
  Layout,
  Menu,
  Space,
  Avatar,
  Typography,
  Input,
  Checkbox,
  Drawer,
  Row,
  Col,
  PageHeader,
  Card,
  Button,
  Empty,
  BackTop,
  Alert,
} from 'antd'
// 图标
import { GithubFilled, SettingFilled, ShareAltOutlined } from '@ant-design/icons'

// 编辑器
import Editor from '@monaco-editor/react'

const { Header, Content, Footer, Sider } = Layout
const { Paragraph, Title } = Typography
const { Search } = Input
const { Meta } = Card

export default function App() {
  // config 加载中
  const [loaded, setLoaded] = useState(false)
  // github 加载中
  const [githubLoaded, setGithubLoaded] = useState(false)

  // 设置菜单
  const [setting, setSetting] = useState(false)
  // 设置错误提醒
  const [settingError, setSettingError] = useState(false)

  const onSettingClose = () => {
    setSetting(false)
  }
  // 配置数据
  const [config, setConfig] = useState({})
  // 代码原始数据
  const [configRaw, setConfigRaw] = useState('')
  // 配置地址
  // const [configURL, setConfigURL] = useState('')

  // 获取配置数据
  useEffect(() => {
    // 读取配置文件
    const fetchConfig = async () => {
      const res = await fetch('config.yaml')
      const raw = await res.text()
      setConfigRaw(raw) // 写入原始数据
    }
    // 读取本地配置
    const localConfig = localStorage.getItem('config')
    if (localConfig) {
      const JSONConfig = JSON.parse(localConfig)
      setConfigRaw(YAML.stringify(JSONConfig))
    } else {
      fetchConfig() // 发起请求
    }
  }, [])

  // 配置文件更改
  const onConfigChange = (value) => {
    // 验证合法性
    try {
      YAML.parse(value)
    } catch {
      return setSettingError(true)
    }
    // 写入配置信息
    setSettingError(false)
    setConfigRaw(value)
    // 存储配置信息
    const parse = YAML.parse(value)
    localStorage.setItem('config', JSON.stringify(parse))
  }

  // 解析配置数据
  useEffect(() => {
    const parse = YAML.parse(configRaw)
    if (parse) {
      // 写入配置信息
      setConfig(parse)
    }
  }, [configRaw])

  // github 信息
  const [githubItems, setGithubItems] = useState([])

  // config 更改后更新配置
  useEffect(() => {
    if (Object.keys(config).length) {
      // 写入默认折叠状态
      setCollapsed(config.Config.hide)
      // 处理侧边栏菜单
      setMenuItems(config.Tabox)
      // 配置默认搜索菜单
      setSearchMenu(Object.keys(config.Search)[0])
      // 配置默认选中搜索菜单
      setSearchKeys(Object.keys(config.Search[Object.keys(config.Search)[0]]))
      // 配置默认选中搜索范围
      setSearchChecked([Object.keys(config.Search[Object.keys(config.Search)[0]])[0]])
      // config 加载成功
      setLoaded(true)
      // 配置 github
      if (config.Tabox.Github !== undefined) {
        fetch(`https://api.github.com/users/${config.Tabox.Github.name}/repos?per_page=100`)
          .then((res) => res.json())
          .then((data) => {
            let repoInfo = data
            repoInfo.sort((a, b) => {
              return b.stargazers_count - a.stargazers_count
            })
            setGithubItems(repoInfo)
            // Github 加载成功
            setGithubLoaded(true)
          })
      }
    }
  }, [config])

  // 侧边栏折叠
  const [collapsed, setCollapsed] = useState(false)

  // 标签组内容
  const [menuItems, setMenuItems] = useState([])

  // 选中的搜索菜单
  const [searchMenu, setSearchMenu] = useState([])
  // 搜索菜单内容
  const [searchKey, setSearchKeys] = useState([])
  // 选中的搜索内容
  const [searchChecked, setSearchChecked] = useState([])

  // 切换搜索菜单
  const onSearchChange = (e) => {
    setSearchMenu(e.key)
    setSearchKeys(Object.keys(config.Search[e.key]))
    setSearchChecked([])
  }

  // 搜索
  const onSearch = (e) => {
    searchChecked.forEach((key) => {
      window.open(config.Search[searchMenu][key] + e)
    })
  }

  // 左上角时间
  const [time, setTime] = useState(new Date())
  setInterval(() => {
    setTime(new Date())
  }, 1000)

  // ico 解析
  const getICO = (logo, url) => {
    return logo ? logo : UrlParse(url).origin + '/favicon.ico'
  }

  // 选中菜单滚动
  const onMenuSelect = (e) => {
    document.getElementById(e.key).scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

  return loaded ? (
    <Layout
      style={{
        minHeight: '100vh',
      }}>
      {/* 侧边栏 */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width="220px"
        style={{ position: 'fixed', height: '100vh' }}>
        {/* 网站标题 */}
        <Space direction="vertical" size="middle" style={{ margin: '1.3rem 1.3rem 0' }}>
          <a target="_blank" href={config.Config.link} rel="noreferrer">
            <Avatar shape="square" size="large" src={config.Config.logo} />
          </a>
          <Title level={2} style={{ color: '#eee', display: collapsed ? 'none' : '' }}>
            {config.Config.title}
          </Title>
        </Space>
        {/* 侧边栏菜单 */}
        <Menu theme="dark" defaultSelectedKeys={[Object.keys(menuItems)[0]]} mode="inline" onSelect={onMenuSelect}>
          {Object.keys(menuItems).map((menuKey) => {
            const menuItem = menuItems[menuKey] // 菜单项
            return (
              <Menu.Item key={menuKey}>
                <Space>
                  <Avatar shape="square" size="small" src={menuItem.logo} />
                  {collapsed ? '' : menuKey}
                </Space>
              </Menu.Item>
            )
          })}
        </Menu>
      </Sider>
      {/* 内容区 */}
      <Layout style={{ marginLeft: collapsed ? '80px' : '220px', transition: collapsed ? 'margin-left 200ms': 'margin-left 400ms'}}>
        {/* 顶部导航 */}
        <Header style={{ backgroundColor: '#abc' }}>
          {/* 时间 */}
          <Title
            level={3}
            style={{
              color: '#fff',
              marginTop: '1rem',
              float: 'left',
            }}>
            {time.getHours() < 10 ? '0' + time.getHours() : time.getHours()}:
            {time.getMinutes() < 10 ? '0' + time.getMinutes() : time.getMinutes()}:
            {time.getSeconds() < 10 ? '0' + time.getSeconds() : time.getSeconds()}
          </Title>
          {/* 设置 */}
          <Title
            level={3}
            style={{
              color: '#fff',
              marginTop: '1rem',
              float: 'right',
              cursor: 'pointer',
            }}>
            <Space size="middle">
              <a href="https://github.com/fzf404/Tabox" target="_blank" rel="noreferrer">
                <GithubFilled style={{ color: '#fff' }} />
              </a>
              <ShareAltOutlined />
              <SettingFilled onClick={() => setSetting(true)} />
            </Space>
          </Title>
          {/* 设置框 */}
          <Drawer
            title="设置"
            placement="right"
            width={document.body.clientWidth < 960 ? '500px' : '600px'}
            onClose={onSettingClose}
            visible={setting}
            extra={
              <Space>
                <Button
                  onClick={() => {
                    localStorage.removeItem('config')
                    window.location.reload()
                  }}
                  danger>
                  清空
                </Button>
              </Space>
            }>
            {/* 错误提醒 */}
            {settingError ? (
              <Alert message="配置文件不合法" type="warning" showIcon style={{ marginBottom: '1rem' }} />
            ) : (
              ''
            )}
            {/* 编辑器 */}
            <Editor
              height="80vh"
              defaultLanguage="yaml"
              defaultValue={configRaw}
              onChange={onConfigChange}
              options={{
                minimap: {
                  enabled: false,
                },
              }}
            />
          </Drawer>
        </Header>
        <Content>
          {/* 搜索栏 */}
          <div
            style={{
              width: '60%',
              maxWidth: '32rem',
              margin: '2rem auto',
            }}>
            {/* 搜索菜单 */}
            <Menu
              style={{ backgroundColor: 'transparent' }}
              mode="horizontal"
              selectedKeys={searchMenu}
              onClick={onSearchChange}>
              {Object.keys(config.Search).map((searchMenuKey) => {
                return <Menu.Item key={searchMenuKey}>{searchMenuKey}</Menu.Item>
              })}
            </Menu>
            {/* 搜索栏 */}
            <Search
              placeholder="Search"
              enterButton="搜 索"
              size="large"
              style={{ margin: '1rem 0' }}
              onSearch={onSearch}
            />
            {/* 搜索范围 */}
            <Checkbox.Group
              defaultValue={searchChecked}
              style={{ width: '100%', margin: '0 1rem' }}
              onChange={(check) => {
                setSearchChecked(check)
              }}>
              <Row>
                {searchKey.map((searchItemKey) => {
                  return (
                    <Col span={5} key={searchItemKey}>
                      <Checkbox value={searchItemKey}>{searchItemKey}</Checkbox>
                    </Col>
                  )
                })}
              </Row>
            </Checkbox.Group>
          </div>
          {/* 标签页内容 */}
          <div>
            {/* 遍历标签组 */}
            {Object.keys(config.Tabox).map((tabKey) => {
              const menuBox = config.Tabox[tabKey]
              return (
                <div
                  id={tabKey}
                  key={tabKey}
                  style={{
                    margin: collapsed
                      ? document.body.clientWidth < 960
                        ? '0 1rem 0 2rem'
                        : '0 4rem 0 6rem'
                      : document.body.clientWidth < 960
                      ? '0 1rem 0 2rem'
                      : '0 2rem 0 4rem',
                    transition: 'margin 300ms',
                  }}>
                  {/* 标签组标题 */}
                  <PageHeader
                    title={tabKey}
                    subTitle={menuBox.description}
                    avatar={{
                      src: menuBox.logo,
                      shape: 'square',
                    }}>
                    <Paragraph
                      style={{
                        marginLeft: '1rem',
                      }}>
                      {/* 标签组内容 */}
                      <Row gutter={[16, 16]}>
                        {Object.keys(menuBox).map((boxKey) => {
                          // 说明内容不渲染
                          if (
                            boxKey === 'url' ||
                            boxKey === 'logo' ||
                            boxKey === 'description' ||
                            boxKey === 'Ignore'
                          ) {
                            return ''
                          }
                          const tabItem = config.Tabox[tabKey][boxKey]
                          // github 渲染
                          if (tabKey === 'Github' && boxKey === 'name') {
                            // 获取忽略的仓库
                            const ignoreItems = config.Tabox.Github.Ignore
                            // 判断 GIthub 仓库是否加载成功
                            return githubLoaded ? (
                              githubItems.map((githubItem) => {
                                if (ignoreItems.some((name) => name === githubItem.name)) {
                                  return ''
                                }
                                return (
                                  <Col key={githubItem.name}>
                                    {/* 仓库信息 */}
                                    <a href={githubItem.html_url} target="_blank" rel="noreferrer">
                                      <Card
                                        size="small"
                                        hoverable
                                        style={{ width: '12rem', height: '5.4rem', borderRadius: '1rem' }}>
                                        <Meta
                                          className="github"
                                          // 仓库名称
                                          title={githubItem.name}
                                          // 仓库 star 数
                                          avatar={
                                            <div>
                                              <span style={{ color: '#08e', fontSize: '1rem', fontWeight: '600' }}>
                                                {githubItem.stargazers_count}
                                              </span>
                                            </div>
                                          }
                                          // 仓库描述
                                          description={
                                            githubItem.description
                                              ? githubItem.description.length > 24
                                                ? githubItem.description.substring(0, 22) + '..'
                                                : githubItem.description
                                              : ''
                                          }
                                        />
                                      </Card>
                                    </a>
                                  </Col>
                                )
                              })
                            ) : (
                              <Empty />
                            )
                          }
                          if (tabKey === 'Memo' && boxKey === 'content') {
                            return (
                              <pre
                                style={{
                                  width: '50%',
                                  maxWidth: '32rem',
                                  marginLeft: '1rem',
                                  padding: '.5rem 1rem',
                                }}>
                                {tabItem}
                              </pre>
                            )
                          }
                          // 默认渲染
                          return tabItem ? (
                            <Col key={boxKey}>
                              {/* 标签内容 */}
                              <a href={tabItem[0]} target="_blank" rel="noreferrer">
                                <Card size="small" hoverable style={{ width: '12rem', borderRadius: '1rem' }}>
                                  <Meta
                                    // 标签标题
                                    title={boxKey}
                                    // 标签头像
                                    avatar={<Avatar shape="square" size="large" src={getICO(tabItem[2], tabItem[0])} />}
                                    // 标签描述
                                    description={tabItem[1]}
                                  />
                                </Card>
                              </a>
                            </Col>
                          ) : (
                            ''
                          )
                        })}
                      </Row>
                    </Paragraph>
                  </PageHeader>
                </div>
              )
            })}
          </div>
          {/* 回到顶部 */}
          <BackTop />
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          Tabox ©{new Date().getFullYear()} Created by{' '}
          <a target="_blank" href="https://www.fzf404.top" rel="noreferrer">
            fzf404
          </a>
        </Footer>
      </Layout>
    </Layout>
  ) : (
    <Spin tip="Loading" size="large" style={{ width: '100vw', height: '100vh', marginTop: '16rem' }} />
  )
}
