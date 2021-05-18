/* eslint-disable react/sort-comp, react/no-unused-state, jsx-a11y/anchor-is-valid */

import React from 'react';
import {
  Row,
  Col,
  Button,
  Checkbox,
  Layout,
  Menu,
  Icon,
  Table,
  Slider,
  Modal,
  Input,
} from 'antd';

import {
  StepBackwardOutlined,
  StepForwardOutlined,
  CaretRightOutlined,
  PauseOutlined,
} from '@ant-design/icons';

import axios from 'axios';

const columns = [{
  title: 'File Name',
  dataIndex: 'fileName',
  key: 'fileName',
  render: (text) => (
    <a
      key={text}
      href="#"
    >
      {text}
    </a>
  ),
}];

function formatTime(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);

  return [m, String(s).padStart(2, 0)].join(':');
}

class Player extends React.Component {
  audioRef = React.createRef();

  currentFolder = '';

  pagination = {
    total: 0,
    showSizeChanger: true,
  };

  // eslint-disable-next-line
  state = {
    playing: '',
    loop: false,
    order: false,
    playIcon: <CaretRightOutlined />,
    curTime: 0,
    totTime: 0,
    data: [],
    fdlist: [],
    collapsed: false,
    source: 'https://pcm.blumia.cn',
    newSource: 'https://pcm.blumia.cn',
    settingsVisible: false,
  };

  onCollapse = (collapsed) => {
    this.setState({ collapsed });
  };

  init = () => {
    this.fetchPlaylist();

    this.audioRef.current.ontimeupdate = () => {
      this.setState({
        curTime: this.audioRef.current.currentTime,
        totTime: this.audioRef.current.duration,
      });
    };

    this.audioRef.current.onpause = () => {
      this.setState({ playIcon: <CaretRightOutlined /> });
    };

    this.audioRef.current.onplay = () => {
      this.setState({ playIcon: <PauseOutlined /> });
    };
  };

  fetchPlaylist = async () => {
    try {
      const {
        source,
      } = this.state;

      const response = await axios({
        method: 'POST',
        url: `${source}/api.php`,
        data: new URLSearchParams({
          do: 'getfilelist',
          folder: '/',
        }),
        headers: new Headers({
          'Content-Type': 'application/x-www-form-urlencoded',
        }),
      });

      this.setState({
        fdlist: response.data.result.data.subFolderList.map((x) => decodeURIComponent(x)),
      });
    } catch (_) {
      //
    }
  };

  fetchMusic = async (folder) => {
    try {
      const {
        source,
      } = this.state;

      const response = await axios({
        method: 'POST',
        url: `${source}/api.php`,
        data: new URLSearchParams({
          do: 'getfilelist',
          folder,
        }),
        headers: new Headers({
          'Content-Type': 'application/x-www-form-urlencoded',
        }),
      });

      this.pagination = {
        total: response.data.result.data.musicList.length,
        showSizeChanger: true,
      };

      this.setState({
        data: response.data.result.data.musicList.map((x) => {
          // eslint-disable-next-line
          x.fileName = decodeURIComponent(x.fileName);
          return x;
        }),
      });
    } catch (_) {
      //
    }
  };

  onMenuClick = ({ key }) => {
    const {
      collapsed,
    } = this.state;

    if (key === 'settings') {
      this.setState({ settingsVisible: true, newRandomKey: Math.random() });
      return;
    }

    if (key !== 'settings' && collapsed) {
      this.setState({ collapsed: false });
    }

    this.currentFolder = key;
    this.fetchMusic(key);
  };

  componentDidMount() {
    this.init();
  }

  playAtIndex = (i) => {
    const {
      data,
      source,
    } = this.state;

    const filename = data[i].fileName;
    this.audioRef.current.pause();
    this.audioRef.current.src = `${source + this.currentFolder}/${filename}`;
    this.audioRef.current.load();
    this.audioRef.current.oncanplay = () => {
      this.audioRef.current.play();
      this.setState({ playing: filename });
    };
  };

  onRow = (record, index) => ({
    onClick: () => {
      const {
        source,
      } = this.state;

      this.audioRef.current.pause();
      this.audioRef.current.src = `${source + this.currentFolder}/${record.fileName}`;
      this.audioRef.current.load();
      this.audioRef.current.play();
      this.setState({ playing: record.fileName });
    },
  });

  onPlayClick = () => {
    const {
      playIcon,
    } = this.state;

    if (playIcon === 'pause') {
      this.audioRef.current.pause();
    } else {
      this.audioRef.current.play();
    }
  };

  onPrevClick = () => {
    const {
      data,
      playing,
    } = this.state;

    const currentIndex = data.findIndex((x) => x.fileName === playing);
    if (currentIndex === -1) {
      this.playAtIndex(0);
    } else if (currentIndex === 0) {
      this.playAtIndex(data.length - 1);
    } else {
      this.playAtIndex(Number(currentIndex) - 1);
    }
  };

  onNextClick = () => {
    const {
      data,
      playing,
    } = this.state;

    const currentIndex = data.findIndex((x) => x.fileName === playing);
    if (currentIndex === -1) {
      this.playAtIndex(0);
    } else if (currentIndex === (data.length - 1)) {
      this.playAtIndex(0);
    } else {
      this.playAtIndex(Number(currentIndex) + 1);
    }
  };

  onLoopChange = (value) => {
    if (value.target.checked) {
      this.audioRef.current.loop = true;
    } else {
      this.audioRef.current.loop = false;
    }
  };

  onOrderChange = (value) => {
    if (value.target.checked) {
      this.audioRef.current.onended = () => {
        if (this.audioRef.current.loop === 0) {
          this.onNextClick();
        }
      };
    } else {
      this.audioRef.current.onended = undefined;
    }
  };

  onSettingsOk = () => {
    const {
      newSource,
    } = this.state;

    this.setState({
      source: newSource,
      settingsVisible: false,
    });
    this.init();
  };

  onSettingsCancel = () => {
    const {
      source,
    } = this.state;

    this.setState({
      newSource: source,
      settingsVisible: false,
    });
  };

  onChange = (event) => {
    this.setState({ newSource: event.target.value });
  };

  onProgressChange = (value) => {
    this.audioRef.current.currentTime = value;
    this.setState({ curTime: value });
  };

  onAfterChange = (value) => {
    this.audioRef.current.currentTime = value;
    this.setState({ curTime: value });
  };

  render() {
    const {
      collapsed,
      fdlist,
      data,
      playing,

      curTime,
      totTime,
      playIcon,

      newRandomKey,
      settingsVisible,

      source,
      newSource,
    } = this.state;

    return (
      <div style={{ height: '100%' }}>
        {/* eslint-disable-next-line */}
        <audio
          ref={this.audioRef}
        />

        <Layout style={{ height: '100%' }}>
          <Layout style={{ height: '100%' }}>
            <Layout.Sider
              collapsible
              collapsed={collapsed}
              onCollapse={this.onCollapse}
              style={{ height: '100%' }}
            >
              <Menu
                theme="dark"
                mode="inline"
                openKeys={['sub1']}
                selectedKeys={collapsed ? [] : [this.currentFolder]}
                style={{ height: '100%' }}
                onClick={this.onMenuClick}
              >
                {collapsed
                  ? (
                    <Menu.Item key="1">
                      <Icon type="folder" />
                    </Menu.Item>
                  )
                  : (
                    <Menu.SubMenu
                      key="sub1"
                      title={(
                        <span>
                          <Icon type="folder" />
                          <span>Folder List</span>
                        </span>
                      )}
                    >
                      {fdlist.map((x) => <Menu.Item key={x}>{x}</Menu.Item>)}
                    </Menu.SubMenu>
                  )
                  // eslint-disable-next-line
                }

                <Menu.Item key="settings">
                  <Icon type="setting" />
                  {' '}
                  {!collapsed && 'Settings'}
                </Menu.Item>
              </Menu>
            </Layout.Sider>
            <Layout style={{ background: '#fff' }}>
              <Layout.Content style={{ margin: '0px' }}>
                <Table
                  dataSource={data}
                  rowKey="fileName"
                  columns={columns}
                  style={{ background: '#fff' }}
                  showHeader={false}
                  pagination={this.pagination}
                  onRow={this.onRow}
                />
              </Layout.Content>
            </Layout>
          </Layout>
          <Layout.Footer
            style={{
              textAlign: 'center',
              background: '#494949',
              paddingLeft: 0,
              paddingRight: 0,
            }}
          >
            <Layout style={{ background: '#494949' }}>
              <Layout.Sider style={{ background: '#494949', color: '#fff' }}>
                <Row type="flex" justify="space-around" align="middle" style={{ height: '100%' }}>
                  <Col span={24}>
                    {playing}
                  </Col>
                </Row>
              </Layout.Sider>
              <Layout.Content style={{ paddingLeft: 0, paddingRight: 0 }}>
                <Row type="flex" justify="space-around" align="middle">
                  <Col style={{ width: 30, color: '#fff' }}>
                    {' '}
                    {formatTime(curTime)}
                    {' '}
                  </Col>
                  <Col style={{ width: 'calc(100% - 340px)', padding: 5 }}>
                    <Slider
                      value={curTime}
                      min={0}
                      max={totTime}
                      step={1}
                      onChange={this.onProgressChange}
                      tipFormatter={formatTime}
                      style={{
                        borderTop: '4px solid #494949',
                        borderBottom: '4px solid #494949',
                      }}
                    />
                  </Col>
                  <Col style={{ width: 30, color: '#fff' }}>
                    {' '}
                    {formatTime(totTime)}
                    {' '}
                  </Col>
                  <Col style={{ overflowY: 'hidden', width: 280, display: 'block' }}>
                    <Button.Group>
                      <Button
                        type="primary"
                        size="large"
                        icon={<StepBackwardOutlined />}
                        onClick={this.onPrevClick}
                      />

                      <Button
                        type="primary"
                        size="large"
                        icon={playIcon}
                        onClick={this.onPlayClick}
                      />

                      <Button
                        type="primary"
                        size="large"
                        icon={<StepForwardOutlined />}
                        onClick={this.onNextClick}
                      />
                    </Button.Group>
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    <Checkbox style={{ color: '#fff' }} onChange={this.onLoopChange}>Loop</Checkbox>
                    <Checkbox style={{ color: '#fff' }} onChange={this.onOrderChange}>Order</Checkbox>
                  </Col>
                </Row>
              </Layout.Content>
            </Layout>
          </Layout.Footer>
        </Layout>
        <Modal
          title="Settings"
          key={newRandomKey}
          visible={settingsVisible}
          onOk={this.onSettingsOk}
          onCancel={this.onSettingsCancel}
        >
          <Input
            addonBefore="PCM Source"
            defaultValue={source}
            value={newSource}
            onChange={this.onChange}
          />
        </Modal>
      </div>
    );
  }
}

export default Player;
