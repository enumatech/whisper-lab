# curl -sI https://nixos.org/channels/nixpkgs-unstable/nixexprs.tar.xz | awk '/Location:/ {print $2}'
with import (
builtins.fetchTarball https://releases.nixos.org/nixpkgs/nixpkgs-18.09pre147700.03e47c388ac/nixexprs.tar.xz
) {};

mkShell rec {
  buildInputs = [
    # Build deps
    python2

    # Process Management
    overmind

    # Node
    nodejs-10_x
    nodePackages_10_x.pnpm

    # Blockchain
    go-ethereum
    solc

    # Utils
    coreutils
    direnv
  ];
}
